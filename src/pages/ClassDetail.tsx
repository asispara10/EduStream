import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  classService, 
  materialService, 
  assignmentService, 
  attendanceService,
  commentService 
} from "../services/api.service.ts";
import { postService } from "../services/post.service.ts";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { 
  MessageSquare, 
  BookOpen, 
  Users, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  FileText,
  Link as LinkIcon,
  BarChart3,
  UserCheck,
  MoreVertical,
  X,
  Download,
  Upload,
  UserPlus,
  Video,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";
import AnnouncementBoard from "../components/AnnouncementBoard.tsx";
import AssignmentCard from "../components/AssignmentCard.tsx";
import MaterialCard from "../components/MaterialCard.tsx";
import ProfileAvatar from "../components/ProfileAvatar.tsx";
import FileUploadComponent from "../components/FileUploadComponent.tsx";
import CommentSection from "../components/CommentSection.tsx";
import DiscussionBoard from "../components/DiscussionBoard.tsx";
import NepalClock from "../components/NepalClock.tsx";
import UpcomingAssignmentNotice from "../components/UpcomingAssignmentNotice.tsx";
import { format } from "date-fns";
import { formatExactTimestamp } from "../utils/date.ts";
import api from "../api/axios.ts";
import LiveClassPage from "./LiveClassPage.tsx";

const ClassDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("announcement");
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLiveClass, setActiveLiveClass] = useState<any>(null);
  const [showLiveClassOverlay, setShowLiveClassOverlay] = useState(false);

  // AI State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [newMaterial, setNewMaterial] = useState({ title: "", description: "", contentType: "PDF", url: "" });
  const [newAssignment, setNewAssignment] = useState({ title: "", instructions: "", deadline: "", totalMarks: 100, attachments: [] as any[] });
  
  // Modal States
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
  const [gradingData, setGradingData] = useState({ grade: "", feedback: "" });
  const [submissionFile, setSubmissionFile] = useState<any[]>([]);
  const [submissionContent, setSubmissionContent] = useState("");

  const fetchData = async () => {
    try {
      const [classRes, matRes, assRes, attRes, liveRes, pendingRes] = await Promise.all([
        classService.getClass(id!),
        materialService.getMaterials(id!),
        assignmentService.getAssignments(id!),
        attendanceService.getAttendance(id!),
        api.get(`/live-class/active/${id}`),
        user?.role === "student" ? assignmentService.getPendingAssignments(id!) : Promise.resolve({ data: { assignments: [] } })
      ]);
      
      setClassroom(classRes.data.class);
      setStudents(classRes.data.students);
      setMaterials(matRes.data.materials);
      setAssignments(assRes.data.assignments);
      setAttendance(attRes.data.attendance || []);
      setActiveLiveClass(liveRes.data.liveClass);
      
      if (user?.role === "student") {
        setPendingAssignments(pendingRes.data.assignments);
      } else {
        // For teachers, show all assignments that are not past deadline as "Upcoming"
        const upcoming = assRes.data.assignments.filter((a: any) => new Date(a.deadline) > new Date());
        setPendingAssignments(upcoming);
      }
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to fetch classroom data"));
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "grades") {
      const fetchSubmissions = async () => {
        if (user?.role === "teacher") {
          const allSubs = await Promise.all(assignments.map(async (ass) => {
            const res = await assignmentService.getSubmissions(ass.id.toString());
            return res.data.submissions.map((sub: any) => ({ ...sub, assignmentId: ass.id }));
          }));
          setAllSubmissions(allSubs.flat());
        } else {
          // For students, fetch their own submission history for each assignment
          const allSubs = await Promise.all(assignments.map(async (ass) => {
            const res = await assignmentService.getSubmissionHistory(ass.id.toString());
            return res.data.history.map((sub: any) => ({ ...sub, assignmentId: ass.id }));
          }));
          setAllSubmissions(allSubs.flat());
        }
      };
      fetchSubmissions();
    }
  }, [activeTab, assignments, user?.role]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-class", parseInt(id!));

    socket.on("new-assignment", (assignment) => {
      setAssignments(prev => [assignment, ...prev]);
      setPendingAssignments(prev => [assignment, ...prev]);
    });

    socket.on("new-material", (material) => {
      setMaterials(prev => [material, ...prev]);
    });

    socket.on("new-comment", (comment) => {
      if (comment.parent_type === 'assignment') {
        setAssignments(prev => prev.map(ass => 
          ass.id === comment.parent_id 
          ? { ...ass, comments: [...(ass.comments || []), comment] }
          : ass
        ));
      }
    });

    socket.on("live-class-started", (liveClass) => {
      setActiveLiveClass(liveClass);
      toast.success("A live class has started!", { icon: "🎥" });
    });

    socket.on("live-class-ended", () => {
      setActiveLiveClass(null);
      setShowLiveClassOverlay(false);
      toast("The live class has ended.", { icon: "👋" });
    });

    return () => {
      socket.off("new-assignment");
      socket.off("new-material");
      socket.off("new-comment");
      socket.off("live-class-started");
      socket.off("live-class-ended");
    };
  }, [socket, id]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await materialService.addMaterial({ ...newMaterial, classId: id });
      setNewMaterial({ title: "", description: "", contentType: "PDF", url: "" });
      setShowMaterialModal(false);
      fetchData();
      toast.success("Material added!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add material"));
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignmentService.createAssignment({ ...newAssignment, classId: id });
      setNewAssignment({ title: "", instructions: "", deadline: "", totalMarks: 100, attachments: [] });
      setShowAssignmentModal(false);
      fetchData();
      toast.success("Assignment created!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create assignment"));
    }
  };

  const handleMarkAttendance = async (studentId: number, status: "present" | "absent") => {
    try {
      await attendanceService.markAttendance({ classId: id, attendanceData: [{ studentId, status }] });
      fetchData();
      toast.success("Attendance updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update attendance"));
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      await assignmentService.submitAssignment({
        assignmentId: selectedAssignment.id,
        content: submissionContent,
        submittedFile: submissionFile[0]?.url || ""
      });
      setSubmissionContent("");
      setSubmissionFile([]);
      setSelectedAssignment(null);
      fetchData();
      toast.success("Assignment submitted successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit assignment"));
    }
  };

  const handleAIQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/context", { classId: id });
      const context = res.data.context;

      const prompt = `
        You are an AI Learning Assistant for a classroom.
        Context: ${context}
        Student Question: ${aiQuestion}
        
        Provide a helpful, educational, and concise answer based on the classroom context if possible.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiAnswer(response.text || "Sorry, I couldn't process your request right now.");
    } catch (err) {
      console.error("AI Error:", err);
      setAiAnswer("Sorry, I couldn't process your request right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartLiveClass = async () => {
    try {
      const res = await api.post("/live-class/start", { classId: id });
      setActiveLiveClass(res.data.liveClass);
      setShowLiveClassOverlay(true);
      toast.success("Live class started!");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to start live class"));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <div className="h-48 bg-indigo-600 p-8 flex flex-col justify-end relative">
          <div className="absolute top-6 right-8 flex gap-3 items-start">
            <NepalClock glass />
            {activeLiveClass ? (
              <button 
                onClick={() => setShowLiveClassOverlay(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all animate-pulse shadow-lg shadow-red-200"
              >
                <div className="w-2 h-2 bg-white rounded-full" /> Join Live Class
              </button>
            ) : user?.role === "teacher" && (
              <button 
                onClick={handleStartLiveClass}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Video className="w-4 h-4" /> Start Live Class
              </button>
            )}
            {classroom.meeting_link && (
              <a 
                href={classroom.meeting_link} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Join Meeting
              </a>
            )}
            <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold">
              Code: {classroom.code}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{classroom.name}</h1>
          <p className="text-indigo-100 mt-2 font-medium">{classroom.description}</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-8 overflow-x-auto no-scrollbar">
          {[
            { id: "announcement", label: "Announcement", icon: MessageSquare },
            { id: "assignment", label: "Assignment", icon: BookOpen },
            { id: "discussions", label: "Discussions", icon: MessageCircle },
            { id: "people", label: "People", icon: Users },
            { id: "grades", label: "Grades", icon: BarChart3 },
            { id: "attendance", label: "Attendance", icon: Calendar },
            { id: "materials", label: "All Materials", icon: FileText },
            { id: "ai", label: "AI Assistant", icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === "materials" && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">All Study Materials</h3>
                  {materials.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No study materials uploaded yet.</div>
                  ) : (
                    <div className="grid gap-4">
                      {materials.map((material) => (
                        <MaterialCard key={material.id} material={material} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === "announcement" && (
              <motion.div 
                key="announcement"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Announcement content */}
                <AnnouncementBoard classId={id!} />
              </motion.div>
            )}

            {activeTab === "assignment" && (
              <motion.div 
                key="assignment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Assignments Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" /> Assignments
                    </h3>
                    {user?.role === "teacher" && (
                      <button 
                        onClick={() => setShowAssignmentModal(true)}
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Create
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No assignments yet</p>
                      </div>
                    ) : (
                      assignments.map(ass => (
                        <AssignmentCard 
                          key={ass.id} 
                          assignment={ass} 
                          onClick={() => {
                            setSelectedAssignment(ass);
                            if (user?.role === "teacher") {
                              setSubmissions([]);
                              assignmentService.getSubmissions(ass.id.toString())
                                .then(res => setSubmissions(res.data.submissions))
                                .catch(err => toast.error("Failed to fetch submissions"));
                            } else {
                              setSubmissionHistory([]);
                              assignmentService.getSubmissionHistory(ass.id.toString())
                                .then(res => setSubmissionHistory(res.data.history))
                                .catch(err => toast.error("Failed to fetch submission history"));
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </section>

                {/* Materials Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" /> Study Materials
                    </h3>
                    {user?.role === "teacher" && (
                      <button 
                        onClick={() => setShowMaterialModal(true)}
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Upload
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materials.length === 0 ? (
                      <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No materials yet</p>
                      </div>
                    ) : (
                      materials.map(mat => (
                        <MaterialCard 
                          key={mat.id} 
                          material={mat} 
                          onDelete={async (id) => {
                            // Removed window.confirm because it is blocked in iframes
                            await materialService.deleteMaterial(id.toString());
                            fetchData();
                            toast.success("Material deleted");
                          }}
                        />
                      ))
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "discussions" && (
              <motion.div 
                key="discussions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <DiscussionBoard classId={id!} />
              </motion.div>
            )}

            {activeTab === "people" && (
              <motion.div 
                key="people"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Classmates ({students.length})</h3>
                  {user?.role === "teacher" && (
                    <button className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-all">
                      <UserPlus className="w-4 h-4" /> Invite
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {students.map(student => (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar 
                          size="md" 
                          userId={student.id} 
                          name={student.name} 
                          showStatus={true} 
                        />
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      {user?.role === "teacher" && (
                        <button 
                          onClick={async () => {
                            // Removed window.confirm because it is blocked in iframes
                            await classService.deleteClass(`${id}/students/${student.id}`);
                            fetchData();
                            toast.success("Student removed");
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "grades" && (
              <motion.div 
                key="grades"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900">Grades Overview</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Homework</th>
                        <th className="px-6 py-4">Marks</th>
                        <th className="px-6 py-4">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {user?.role === "teacher" ? (
                        students.flatMap(student => 
                          assignments.map(ass => {
                            const submission = allSubmissions.find(sub => sub.assignmentId === ass.id && (String(sub.user_id) === String(student.id) || String(sub.student_id) === String(student.id)));
                            return (
                              <tr key={`grade-teacher-${student.id || 'idx'}-${ass.id || 'idx'}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                                <td className="px-6 py-4 text-slate-600">{ass.title}</td>
                                <td className="px-6 py-4 text-slate-600">
                                  {submission ? (
                                    <span className="font-bold text-slate-900">{submission.grade || "--"} / {ass.total_marks || 100}</span>
                                  ) : (
                                    <span className="text-slate-400">-- / {ass.total_marks || 100}</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-xs italic max-w-xs truncate">
                                  {submission?.feedback || "--"}
                                </td>
                              </tr>
                            );
                          })
                        )
                      ) : (
                        assignments.map(ass => {
                          const submission = allSubmissions.find(sub => sub.assignmentId === ass.id);
                          return (
                            <tr key={`grade-student-${user?.id || 'me'}-${ass.id || 'idx'}`} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">{user?.name}</td>
                              <td className="px-6 py-4 text-slate-600">{ass.title}</td>
                              <td className="px-6 py-4 text-slate-600">
                                {submission ? (
                                  <span className="font-bold text-slate-900">{submission.grade || "--"} / {ass.total_marks || 100}</span>
                                ) : (
                                  <span className="text-slate-400">-- / {ass.total_marks || 100}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-600 text-xs italic max-w-xs truncate">
                                {submission?.feedback || "--"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      
                      {assignments.length === 0 && (
                        <tr key="no-grades-row">
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                            No grades available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "attendance" && (
              <motion.div 
                key="attendance"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Attendance Report</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate(`/class/${id}/attendance`)}
                      className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-all"
                    >
                      <BarChart3 className="w-4 h-4" /> Full History
                    </button>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Today: {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Present Days</th>
                        <th className="px-6 py-4">Total Days</th>
                        <th className="px-6 py-4">Percentage</th>
                        {user?.role === "teacher" && <th className="px-6 py-4 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.map((record, idx) => (
                        <tr key={record.student_id || `att-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{record.name}</td>
                          <td className="px-6 py-4 text-slate-600">{record.present_count}</td>
                          <td className="px-6 py-4 text-slate-600">{record.total_days}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              (record.present_count / (record.total_days || 1)) > 0.75 
                              ? "bg-green-50 text-green-600" 
                              : "bg-red-50 text-red-600"
                            }`}>
                              {Math.round((record.present_count / (record.total_days || 1)) * 100)}%
                            </span>
                          </td>
                          {user?.role === "teacher" && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleMarkAttendance(record.student_id, "present")}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                  title="Mark Present"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleMarkAttendance(record.student_id, "absent")}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Mark Absent"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-slate-100 bg-indigo-600 text-white flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">AI Learning Assistant</h3>
                    <p className="text-xs text-indigo-100">Ask me anything about this class!</p>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                  {aiAnswer ? (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-slate-700 text-sm leading-relaxed">
                        {aiAnswer}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="bg-indigo-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-indigo-300" />
                      </div>
                      <p className="text-slate-400 text-sm">No queries yet. Start by asking a question below.</p>
                    </div>
                  )}
                  {aiLoading && (
                    <div className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0" />
                      <div className="bg-slate-100 h-20 w-3/4 rounded-2xl" />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleAIQuery} className="relative">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      placeholder="e.g. What are the main topics covered in this class?"
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={aiLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-8 h-8 mb-4 opacity-50" />
            <h4 className="font-bold text-lg mb-2">Need help?</h4>
            <p className="text-indigo-100 text-xs leading-relaxed mb-4">
              Our AI Learning Assistant is trained on your class materials to help you succeed.
            </p>
            <button 
              onClick={() => setActiveTab("ai")}
              className="w-full bg-white text-indigo-600 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all"
            >
              Ask AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAssignmentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Create Assignment</h2>
                <button onClick={() => setShowAssignmentModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleCreateAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                      <input
                        type="text"
                        required
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Weekly Quiz 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                      <input
                        type="datetime-local"
                        required
                        value={newAssignment.deadline}
                        onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Marks</label>
                      <input
                        type="number"
                        required
                        value={newAssignment.totalMarks}
                        onChange={(e) => setNewAssignment({ ...newAssignment, totalMarks: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Instructions</label>
                      <textarea
                        value={newAssignment.instructions}
                        onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-44 resize-none"
                        placeholder="Provide detailed instructions..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Attachments</label>
                  <FileUploadComponent 
                    files={newAssignment.attachments}
                    onFilesChange={(files) => setNewAssignment({ ...newAssignment, attachments: files })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignmentModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showMaterialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add Material</h2>
                <button onClick={() => setShowMaterialModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Lecture Slides - Week 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                    <select
                      value={newMaterial.contentType}
                      onChange={(e) => setNewMaterial({ ...newMaterial, contentType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="PDF">PDF</option>
                      <option value="Image">Image</option>
                      <option value="Link">Link</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL</label>
                    <input
                      type="text"
                      required
                      value={newMaterial.url}
                      onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMaterialModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                  >
                    Add Material
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedAssignment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selectedAssignment.title}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Due {format(new Date(selectedAssignment.deadline), "MMM d, h:mm a")}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                      {selectedAssignment.total_marks} Points
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissions([]);
                    setSubmissionHistory([]);
                  }} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="prose prose-slate max-w-none">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Instructions</h4>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedAssignment.instructions || "No instructions provided."}</p>
                  </div>

                  {Array.isArray(selectedAssignment.attachments) && selectedAssignment.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Reference Materials</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedAssignment.attachments.map((file: any, idx: number) => (
                          <a 
                            key={`${file.name}-${idx}`} 
                            href={file.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-all group"
                          >
                            <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-indigo-600">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <CommentSection 
                    parentId={selectedAssignment.id} 
                    parentType="assignment" 
                    comments={selectedAssignment.comments || []} 
                    onCommentAdded={fetchData}
                  />
                </div>

                <div className="space-y-6">
                  {user?.role === "teacher" ? (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Student Status ({students.length})</h4>
                      <div className="space-y-3">
                        {students.map(student => {
                          const sub = submissions.find(s => (String(s.user_id) === String(student.id) || String(s.student_id) === String(student.id)));
                          const status = sub ? (sub.grade ? 'Graded' : 'Submitted') : 'Pending';
                          const statusColor = status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : status === 'Submitted' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500';
                          
                          return (
                            <div key={student.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                  {student.name?.charAt(0) || "?"}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{student.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor}`}>
                                  {status}
                                </span>
                                {sub && (
                                  <button 
                                    onClick={() => {
                                      setSelectedSubmission(sub);
                                      setGradingData({ grade: sub.grade || "", feedback: sub.feedback || "" });
                                    }}
                                    className="px-3 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                  >
                                    View
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-4">Your Work</h4>
                      <form onSubmit={handleSubmitAssignment} className="space-y-4">
                        <textarea
                          placeholder="Add comments or content for your submission..."
                          value={submissionContent}
                          onChange={e => setSubmissionContent(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-sm"
                        />
                        
                        <FileUploadComponent 
                          files={submissionFile}
                          onFilesChange={setSubmissionFile}
                        />

                        <button 
                          type="submit"
                          disabled={submissionFile.length === 0 && !submissionContent.trim()}
                          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          {submissionHistory.length > 0 ? "Resubmit" : "Turn In"}
                        </button>
                      </form>

                      {submissionHistory.length > 0 && (
                        <div className="mt-8 space-y-4">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Submission History</h4>
                          <div className="space-y-3">
                            {submissionHistory.map((sub) => (
                              <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-indigo-600">Attempt #{sub.attempt_number}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{formatExactTimestamp(sub.submitted_at)}</span>
                                </div>
                                {sub.grade && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">Grade:</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{sub.grade}</span>
                                  </div>
                                )}
                                {sub.feedback && (
                                  <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                                    "{sub.feedback}"
                                  </div>
                                )}
                                {sub.submitted_file && (
                                  <a 
                                    href={sub.submitted_file} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 hover:underline"
                                  >
                                    <Download className="w-3 h-3" /> View Submitted File
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {selectedSubmission && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <ProfileAvatar size="md" userId={selectedSubmission.student_id} name={selectedSubmission.student_name} src={selectedSubmission.student_avatar} />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedSubmission.student_name}</h3>
                    <p className="text-xs text-slate-500">Attempt #{selectedSubmission.attempt_number} • {formatExactTimestamp(selectedSubmission.submitted_at)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedSubmission(null);
                    setGradingData({ grade: "", feedback: "" });
                  }} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Submission Content</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedSubmission.content || "No text content provided."}</p>
                  {selectedSubmission.submitted_file && (
                    <div className="mt-4">
                      <a 
                        href={selectedSubmission.submitted_file} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:border-indigo-300 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> View Submitted File
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grade & Feedback</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Grade</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 85/100"
                        value={gradingData.grade}
                        onChange={(e) => setGradingData({ ...gradingData, grade: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Feedback</label>
                      <textarea 
                        placeholder="Add feedback for the student..."
                        value={gradingData.feedback}
                        onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-20 resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await assignmentService.gradeSubmission(selectedSubmission.id.toString(), { ...gradingData, grade: gradingData.grade || "Complete" });
                          toast.success("Submission marked as graded!");
                          setSelectedSubmission(null);
                          setGradingData({ grade: "", feedback: "" });
                          fetchData();
                          const res = await assignmentService.getSubmissions(selectedAssignment.id.toString());
                          setSubmissions(res.data.submissions);
                          setAllSubmissions(prev => prev.map(sub => sub.id === selectedSubmission.id ? { ...sub, grade: gradingData.grade || "Complete", feedback: gradingData.feedback } : sub));
                        } catch (err) {
                          toast.error(getErrorMessage(err, "Failed to submit grade"));
                        }
                      }}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Submit Grade
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await assignmentService.gradeSubmission(selectedSubmission.id.toString(), { ...gradingData, grade: "Complete" });
                          toast.success("Submission marked as complete!");
                          setSelectedSubmission(null);
                          setGradingData({ grade: "", feedback: "" });
                          fetchData();
                          const res = await assignmentService.getSubmissions(selectedAssignment.id.toString());
                          setSubmissions(res.data.submissions);
                          setAllSubmissions(prev => prev.map(sub => sub.id === selectedSubmission.id ? { ...sub, grade: "Complete", feedback: gradingData.feedback } : sub));
                        } catch (err) {
                          toast.error(getErrorMessage(err, "Failed to mark as complete"));
                        }
                      }}
                      className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Class Overlay */}
      <AnimatePresence>
        {showLiveClassOverlay && (
          <LiveClassPage 
            key={`live-class-overlay-${id}`} 
            classId={id} 
            onClose={() => setShowLiveClassOverlay(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassDetail;

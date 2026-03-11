import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'uploads', 'database.sqlite');

let db: any;
try {
  db = new Database(dbPath);
  console.log(`Successfully connected to database at ${dbPath}`);
} catch (err) {
  console.error('Failed to connect to database:', err);
  // Fallback to in-memory if file fails
  db = new Database(':memory:');
  console.log('Using in-memory database fallback');
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'teacher')) NOT NULL,
    avatar TEXT,
    profileImage TEXT,
    notif_comments_on_posts INTEGER DEFAULT 1,
    notif_mentions INTEGER DEFAULT 1,
    notif_private_comments INTEGER DEFAULT 1,
    notif_teacher_posts INTEGER DEFAULT 1,
    notif_teacher_announcements INTEGER DEFAULT 1,
    notif_new_assignments INTEGER DEFAULT 1,
    notif_returned_work INTEGER DEFAULT 1,
    notif_invitations INTEGER DEFAULT 1,
    notif_due_reminders INTEGER DEFAULT 1,
    notif_late_submissions INTEGER DEFAULT 1,
    notif_resubmissions INTEGER DEFAULT 1,
    notif_co_teach INTEGER DEFAULT 1,
    notif_scheduled_posts INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('announcement', 'assignment', 'holiday', 'grade', 'deadline')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    class_id INTEGER,
    read INTEGER DEFAULT 0, -- 0 for false, 1 for true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT,
    section TEXT,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    teacher_id INTEGER NOT NULL,
    meeting_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    user_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, class_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL, -- 'pdf', 'doc', 'image', 'link', 'youtube'
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    deadline DATETIME NOT NULL,
    total_marks INTEGER DEFAULT 100,
    attachments TEXT, -- JSON array of URLs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    content TEXT,
    submitted_file TEXT, -- URL or path
    grade TEXT,
    feedback TEXT,
    attempt_number INTEGER DEFAULT 1,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
    UNIQUE(class_id, student_id, date),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    attachments TEXT, -- JSON array of URLs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_type TEXT CHECK(parent_type IN ('announcement', 'assignment')) NOT NULL,
    parent_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS monthly_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM
    total_days_present INTEGER DEFAULT 0,
    UNIQUE(student_id, class_id, month),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS daily_attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monthly_attendance_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    present INTEGER DEFAULT 1, -- 1 for true
    UNIQUE(monthly_attendance_id, date),
    FOREIGN KEY (monthly_attendance_id) REFERENCES monthly_attendance(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS live_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    is_live INTEGER DEFAULT 1, -- 1 for true, 0 for false
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS live_class_participants (
    live_class_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (live_class_id, user_id),
    FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS live_class_removed_users (
    live_class_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (live_class_id, user_id),
    FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS live_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    live_class_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0, -- 0 for false, 1 for true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS discussions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS discussion_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discussion_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration: Add new notification columns if they don't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN notif_teacher_announcements INTEGER DEFAULT 1");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN notif_new_assignments INTEGER DEFAULT 1");
} catch (e) {}
try {
  db.exec("ALTER TABLE submissions ADD COLUMN attempt_number INTEGER DEFAULT 1");
} catch (e) {}
try {
  db.exec("ALTER TABLE announcements ADD COLUMN image_url TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE announcements ADD COLUMN video_url TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE announcements ADD COLUMN link_url TEXT");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    post_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER, -- Nullable for Global Stream
    user_id INTEGER NOT NULL,
    user_role TEXT NOT NULL,
    post_type TEXT CHECK(post_type IN ('GLOBAL_STREAM', 'CLASS_STREAM', 'ANNOUNCEMENT')) NOT NULL,
    title TEXT,
    text_content TEXT,
    media_type TEXT CHECK(media_type IN ('image', 'video', 'link', 'none')) DEFAULT 'none',
    image_url TEXT,
    video_url TEXT,
    link_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS post_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('love', 'sad', 'angry')) NOT NULL,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

try {
  db.exec("ALTER TABLE posts RENAME COLUMN id TO post_id");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts RENAME COLUMN author_id TO user_id");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts RENAME COLUMN caption TO text_content");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts ADD COLUMN title TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts ADD COLUMN post_type TEXT CHECK(post_type IN ('GLOBAL_STREAM', 'CLASS_STREAM', 'ANNOUNCEMENT')) DEFAULT 'CLASS_STREAM'");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts ADD COLUMN user_role TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts ADD COLUMN media_type TEXT CHECK(media_type IN ('image', 'video', 'link', 'none')) DEFAULT 'none'");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts ADD COLUMN video_url TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts ADD COLUMN post_type TEXT CHECK(post_type IN ('GLOBAL_STREAM', 'CLASS_STREAM')) DEFAULT 'CLASS_STREAM'");
} catch (e) {}
try {
  db.exec("ALTER TABLE posts MODIFY COLUMN class_id INTEGER NULL");
} catch (e) {}

export default db;

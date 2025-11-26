import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Task, Log } from "./models";
import { InferSchemaType } from "mongoose";

// Kiểu từ schema
type UserType = InferSchemaType<typeof User.schema>;
type TaskType = InferSchemaType<typeof Task.schema>;
type LogType = InferSchemaType<typeof Log.schema>;

// Dữ liệu mẫu
const KITCHEN_TASKS: Omit<TaskType, "_id" | "isCompleted" | "completedBy" | "completedAt" | "createdAt" | "updatedAt">[] = [
  { title: "Kiểm tra nhiệt độ tủ đông/mát", description: "Đảm bảo tủ mát < 5 độ, tủ đông < -18 độ. Ghi vào sổ theo dõi.", department: "Bep", shift: "sang" },
  { title: "Kiểm tra hệ thống Gas & Hút khói", description: "Bật quạt hút, kiểm tra van gas trung tâm.", department: "Bep", shift: "sang" },
  { title: "Rã đông thịt bò Mỹ (Ca sáng)", description: "Chuyển thịt từ đông sang mát cho ca tối.", department: "Bep", shift: "sang" },
  { title: "Chuẩn bị sốt ướp BBQ", description: "Pha 5 lít sốt ướp tiêu chuẩn, dán nhãn ngày tháng.", department: "Bep", shift: "sang" },
];

const SERVICE_TASKS: Omit<TaskType, "_id" | "isCompleted" | "completedBy" | "completedAt" | "createdAt" | "updatedAt">[] = [
  { title: "Vệ sinh mặt bàn & Ghế", description: "Dùng cồn lau sạch dầu mỡ trên bàn và ghế da.", department: "PhucVu", shift: "sang" },
  { title: "Setup bàn ăn tiêu chuẩn", description: "4 bát, 4 đũa, 1 kẹp nướng, 1 kéo, khăn giấy.", department: "PhucVu", shift: "sang" },
];

// Hàm seed
export const seedDatabase = async () => {
  // Xóa dữ liệu cũ
  await User.deleteMany({});
  await Task.deleteMany({});
  await Log.deleteMany({});

  // Hash password mặc định
  const passwordHash = await bcrypt.hash("123456", 10);

  // Tạo users
  const users: Omit<UserType, "_id" | "createdAt" | "updatedAt">[] = [
    { name: "Quản Lý Tuấn", email: "admin@phobbq.com", passwordHash, role: "manager" },
    { name: "Bếp Trưởng Nam", email: "bep1@phobbq.com", passwordHash, role: "staff", department: "Bep" },
    { name: "Phụ Bếp Lan", email: "bep2@phobbq.com", passwordHash, role: "staff", department: "Bep" },
    { name: "Tổ Trưởng Phục Vụ", email: "phucvu1@phobbq.com", passwordHash, role: "staff", department: "PhucVu" },
    { name: "Nhân Viên Chạy Bàn", email: "phucvu2@phobbq.com", passwordHash, role: "staff", department: "PhucVu" },
  ];

  await User.insertMany(users);
  console.log("Users seeded:", users.length);

  // Tạo tasks
  const allTasks: TaskType[] = [];

  // Morning shift
  KITCHEN_TASKS.forEach((t) =>
    allTasks.push({
      ...t,
      shift: "sang",
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
  SERVICE_TASKS.forEach((t) =>
    allTasks.push({
      ...t,
      shift: "sang",
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  // Evening shift (copy và đổi shift)
  KITCHEN_TASKS.forEach((t) =>
    allTasks.push({
      ...t,
      shift: "chieu",
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
  SERVICE_TASKS.forEach((t) =>
    allTasks.push({
      ...t,
      shift: "chieu",
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await Task.insertMany(allTasks);
  console.log("Tasks seeded:", allTasks.length);
};

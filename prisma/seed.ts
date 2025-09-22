// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding…');
  console.log('Database URL (masked):', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
  
  // Check if any users already exist
  const existingUsers = await prisma.user.findMany();
  console.log('Existing users before seed:', existingUsers.length);

  // Mật khẩu hash cho cả 3 tài khoản demo: 123456
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1) Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartbp.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@smartbp.local',
      password: passwordHash,
      role: 'ADMIN',
      gender: 'OTHER',
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@smartbp.local' },
    update: {},
    create: {
      name: 'Dr. House',
      email: 'doctor@smartbp.local',
      password: passwordHash,
      role: 'DOCTOR',
      gender: 'MALE',
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: 'patient@smartbp.local' },
    update: {},
    create: {
      name: 'Jane Patient',
      email: 'patient@smartbp.local',
      password: passwordHash,
      role: 'PATIENT',
      gender: 'FEMALE',
      phone: '0900000000',
      dateOfBirth: new Date('1995-06-01'),
    },
  });

  // 2) DeviceBinding cho patient (để trống thông tin, bạn có thể bind sau trong UI)
  await prisma.deviceBinding.upsert({
    where: { userId: patient.id },
    update: {},
    create: {
      userId: patient.id,
      mac: null,     // bạn sẽ set trong /patient/monitoring
      piHost: null,  // bạn sẽ set trong /patient/monitoring
    },
  });

  // 3) Assignment: bác sĩ theo dõi bệnh nhân
  await prisma.assignment.upsert({
    where: {
      doctorId_patientId: { doctorId: doctor.id, patientId: patient.id },
    },
    update: {},
    create: {
      doctorId: doctor.id,
      patientId: patient.id,
    },
  });

  // Xoá measurement cũ của bệnh nhân (để seed idempotent)
  await prisma.measurement.deleteMany({ where: { userId: patient.id } });

  // 4) Measurements mẫu (12 bản ghi trong ~12 ngày gần đây)
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

  const samples = [
    { sys: 118, dia: 75,  pulse: 69, day: 12, method: 'MANUAL' as const },
    { sys: 121, dia: 77,  pulse: 72, day: 11, method: 'MANUAL' as const },
    { sys: 126, dia: 79,  pulse: 71, day: 10, method: 'MANUAL' as const },
    { sys: 129, dia: 82,  pulse: 74, day: 9,  method: 'BLUETOOTH' as const },
    { sys: 132, dia: 85,  pulse: 76, day: 8,  method: 'BLUETOOTH' as const },
    { sys: 124, dia: 78,  pulse: 70, day: 7,  method: 'MANUAL' as const },
    { sys: 128, dia: 81,  pulse: 73, day: 6,  method: 'BLUETOOTH' as const },
    { sys: 134, dia: 86,  pulse: 78, day: 5,  method: 'BLUETOOTH' as const },
    { sys: 122, dia: 76,  pulse: 69, day: 4,  method: 'MANUAL' as const },
    { sys: 127, dia: 80,  pulse: 72, day: 3,  method: 'BLUETOOTH' as const },
    { sys: 131, dia: 83,  pulse: 75, day: 2,  method: 'BLUETOOTH' as const },
    { sys: 125, dia: 79,  pulse: 71, day: 1,  method: 'MANUAL' as const },
  ];

  const created = await prisma.$transaction(
    samples.map((s) =>
      prisma.measurement.create({
        data: {
          userId: patient.id,
          sys: s.sys,
          dia: s.dia,
          pulse: s.pulse,
          method: s.method,
          takenAt: daysAgo(s.day),
        },
      })
    )
  );

  // 5) Notes mẫu (bác sĩ viết cho bệnh nhân, gắn vào vài measurement mới nhất)
  if (created.length) {
    const latest = created.slice(-3); // 3 bản ghi gần nhất
    await prisma.$transaction(
      latest.map((m, idx) =>
        prisma.note.create({
          data: {
            doctorId: doctor.id,
            patientId: patient.id,
            measurementId: m.id,
            content:
              idx === 0
                ? 'Tiếp tục theo dõi chế độ ăn muối, kết hợp đi bộ nhẹ 30 phút/ngày.'
                : idx === 1
                ? 'Nhịp tim ổn, duy trì lịch đo vào buổi sáng và tối.'
                : 'Uống đủ nước và ngủ đủ giấc, kiểm tra lại sau 3 ngày.',
          },
        })
      )
    );
  }

  // 6) Một vài thông báo mẫu
  await prisma.notification.createMany({
    data: [
      { userId: patient.id, title: 'Lời nhắc', body: 'Đến giờ đo huyết áp buổi sáng.' },
      { userId: patient.id, title: 'Kết quả', body: 'Kết quả gần đây đã được bác sĩ xem.' },
    ],
  });

  // 7) Log mẫu
  await prisma.auditLog.create({
    data: {
      userId: patient.id,
      action: 'SEED_CREATE',
      meta: { samples: created.length },
      ip: '127.0.0.1',
    },
  });

  // 8) Alerts mẫu cho measurements có huyết áp cao
  const highBPMeasurements = created.filter(m => m.sys >= 130 || m.dia >= 85);
  if (highBPMeasurements.length > 0) {
    await prisma.alert.createMany({
      data: highBPMeasurements.slice(0, 3).map((m, idx) => ({
        measurementId: m.id,
        message: idx === 0 
          ? 'Huyết áp cao - Cần theo dõi chặt chẽ' 
          : idx === 1 
          ? 'Huyết áp vượt ngưỡng bình thường' 
          : 'Khuyến nghị tái khám sớm',
        severity: m.sys >= 140 ? 'HIGH' : 'MEDIUM'
      }))
    });
    console.log(`Created ${Math.min(3, highBPMeasurements.length)} alerts for high BP measurements`);
  }

  console.log('Done. Users:', { admin: admin.email, doctor: doctor.email, patient: patient.email });
  console.log(`Created ${created.length} measurements for patient: ${patient.email}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

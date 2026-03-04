import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50c?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop&q=80",
];

async function seed() {
  console.log("Seeding demo data...\n");

  // 1. Create demo auth users
  const demoUsers = [
    { email: "aziz@demo.klass.uz", name: "Азиз Каримов", role: "creator" },
    { email: "dinara@demo.klass.uz", name: "Динара Усманова", role: "creator" },
    { email: "sherzod@demo.klass.uz", name: "Шерзод Рахимов", role: "creator" },
    { email: "learner1@demo.klass.uz", name: "Алишер Навоев", role: "learner" },
    { email: "learner2@demo.klass.uz", name: "Камила Юсупова", role: "learner" },
  ];

  const userIds: string[] = [];

  for (const u of demoUsers) {
    // Check if user exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", u.email)
      .single();

    if (existing) {
      console.log(`  User ${u.email} already exists, skipping`);
      userIds.push(existing.id);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "demo1234",
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (error) {
      // User exists in auth but not in public.users — look them up
      if (error.message.includes("already been registered")) {
        const { data: authList } = await supabase.auth.admin.listUsers();
        const authUser = authList?.users?.find((au) => au.email === u.email);
        if (authUser) {
          // Ensure public.users row exists
          await supabase
            .from("users")
            .upsert({ id: authUser.id, email: u.email, name: u.name, role: u.role }, { onConflict: "id" });
          userIds.push(authUser.id);
          console.log(`  Recovered existing auth user: ${u.name} (${u.email})`);
          continue;
        }
      }
      console.error(`  Failed to create user ${u.email}:`, error.message);
      continue;
    }

    userIds.push(data.user.id);

    // Update role in public.users (trigger creates with default)
    await supabase
      .from("users")
      .update({ role: u.role, name: u.name })
      .eq("id", data.user.id);

    console.log(`  Created user: ${u.name} (${u.email})`);
  }

  if (userIds.length < 5) {
    console.error("Not enough users created, aborting");
    process.exit(1);
  }

  // 2. Create communities
  const communities = [
    {
      creator_id: userIds[0],
      name: "Маркетинг с нуля",
      slug: "marketing-s-nulya",
      description: "Изучите основы маркетинга: от стратегии до запуска рекламных кампаний. Реальные кейсы из Узбекистана.",
      cover_image: COVER_IMAGES[0],
      is_paid: true,
      price_uzs: 9900000, // 99 000 UZS
      category: "marketing",
    },
    {
      creator_id: userIds[1],
      name: "Веб-дизайн PRO",
      slug: "web-design-pro",
      description: "Курсы по Figma, UI/UX дизайну и созданию современных интерфейсов. Портфолио за 30 дней.",
      cover_image: COVER_IMAGES[1],
      is_paid: true,
      price_uzs: 14900000, // 149 000 UZS
      category: "design",
    },
    {
      creator_id: userIds[2],
      name: "Бизнес-мышление",
      slug: "biznes-myshlenie",
      description: "Предпринимательское мышление, стартапы, финансовая грамотность. Учитесь у практиков.",
      cover_image: COVER_IMAGES[2],
      is_paid: false,
      price_uzs: 0,
      category: "business",
    },
    {
      creator_id: userIds[0],
      name: "English для IT",
      slug: "english-dlya-it",
      description: "Технический английский для разработчиков. Собеседования, документация, общение с клиентами.",
      cover_image: COVER_IMAGES[3],
      is_paid: true,
      price_uzs: 7900000, // 79 000 UZS
      category: "language",
    },
    {
      creator_id: userIds[1],
      name: "Фитнес & Здоровье",
      slug: "fitness-zdorovye",
      description: "Тренировки, питание, здоровый образ жизни. Программы для дома и зала.",
      cover_image: COVER_IMAGES[4],
      is_paid: false,
      price_uzs: 0,
      category: "fitness",
    },
  ];

  const communityIds: string[] = [];

  for (const c of communities) {
    const { data: existing } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", c.slug)
      .single();

    if (existing) {
      console.log(`  Community "${c.name}" already exists, skipping`);
      communityIds.push(existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from("communities")
      .insert(c)
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create community "${c.name}":`, error.message);
      continue;
    }

    communityIds.push(data.id);
    console.log(`  Created community: ${c.name}`);
  }

  // 3. Create memberships (learners join communities)
  const membershipPairs = [
    [userIds[3], communityIds[0]], // Learner1 → Marketing
    [userIds[3], communityIds[1]], // Learner1 → Web Design
    [userIds[3], communityIds[2]], // Learner1 → Business
    [userIds[4], communityIds[0]], // Learner2 → Marketing
    [userIds[4], communityIds[2]], // Learner2 → Business
    [userIds[4], communityIds[4]], // Learner2 → Fitness
  ];

  for (const [userId, communityId] of membershipPairs) {
    if (!userId || !communityId) continue;
    const { error } = await supabase
      .from("memberships")
      .upsert(
        { user_id: userId, community_id: communityId, status: "active" },
        { onConflict: "user_id,community_id" }
      );
    if (error && !error.message.includes("duplicate")) {
      console.error(`  Membership error:`, error.message);
    }
  }
  console.log("  Created memberships");

  // 4. Create courses and lessons
  const coursesData = [
    {
      community_id: communityIds[0], // Marketing
      title: "Основы маркетинга",
      description: "Введение в маркетинг: целевая аудитория, позиционирование, каналы продвижения",
      order_index: 0,
      lessons: [
        { title: "Что такое маркетинг", duration_minutes: 15, order_index: 0 },
        { title: "Целевая аудитория", duration_minutes: 20, order_index: 1 },
        { title: "Позиционирование бренда", duration_minutes: 18, order_index: 2 },
        { title: "Каналы продвижения", duration_minutes: 25, order_index: 3 },
      ],
    },
    {
      community_id: communityIds[0], // Marketing
      title: "SMM с нуля",
      description: "Продвижение в социальных сетях: Instagram, Telegram, TikTok",
      order_index: 1,
      lessons: [
        { title: "Instagram для бизнеса", duration_minutes: 22, order_index: 0 },
        { title: "Telegram-каналы", duration_minutes: 18, order_index: 1 },
        { title: "Контент-план", duration_minutes: 15, order_index: 2 },
      ],
    },
    {
      community_id: communityIds[1], // Web Design
      title: "Figma для начинающих",
      description: "Изучите Figma с нуля и создайте свой первый макет",
      order_index: 0,
      lessons: [
        { title: "Интерфейс Figma", duration_minutes: 12, order_index: 0 },
        { title: "Фреймы и компоненты", duration_minutes: 20, order_index: 1 },
        { title: "Прототипирование", duration_minutes: 25, order_index: 2 },
        { title: "Стили и переменные", duration_minutes: 18, order_index: 3 },
        { title: "Итоговый проект", duration_minutes: 30, order_index: 4 },
      ],
    },
    {
      community_id: communityIds[2], // Business
      title: "Стартап за 30 дней",
      description: "От идеи до первого клиента",
      order_index: 0,
      lessons: [
        { title: "Поиск идеи", duration_minutes: 15, order_index: 0 },
        { title: "Валидация гипотез", duration_minutes: 20, order_index: 1 },
        { title: "MVP и запуск", duration_minutes: 25, order_index: 2 },
      ],
    },
  ];

  for (const course of coursesData) {
    if (!course.community_id) continue;
    const { lessons, ...courseData } = course;
    const { data: newCourse, error } = await supabase
      .from("courses")
      .insert(courseData)
      .select("id")
      .single();

    if (error) {
      console.error(`  Course error:`, error.message);
      continue;
    }

    const lessonRows = lessons.map((l) => ({
      ...l,
      course_id: newCourse.id,
    }));

    await supabase.from("lessons").insert(lessonRows);
    console.log(`  Created course: ${course.title} (${lessons.length} lessons)`);
  }

  // 5. Create posts
  const posts = [
    {
      community_id: communityIds[0],
      author_id: userIds[0],
      content: "Добро пожаловать в сообщество! 🎉\n\nЗдесь мы учимся маркетингу на реальных примерах из Узбекистана. Начните с курса «Основы маркетинга» в классной комнате.\n\nЕсли есть вопросы — пишите в комментариях!",
      is_pinned: true,
    },
    {
      community_id: communityIds[0],
      author_id: userIds[3],
      content: "Только что закончил урок по целевой аудитории — очень полезно! Раньше я думал, что мой продукт для всех, а оказывается нужно четко определить сегмент. Кто-нибудь уже составлял портрет клиента?",
      is_pinned: false,
    },
    {
      community_id: communityIds[1],
      author_id: userIds[1],
      content: "🔥 Новый курс по Figma уже доступен!\n\n5 уроков от базы до итогового проекта. По завершении у вас будет готовый макет в портфолио.\n\nНачинайте в классной комнате → ",
      is_pinned: true,
    },
    {
      community_id: communityIds[2],
      author_id: userIds[2],
      content: "Сегодня обсуждаем: какие бизнес-идеи актуальны в 2025 году в Узбекистане?\n\nДелитесь мыслями в комментариях 👇",
      is_pinned: false,
    },
    {
      community_id: communityIds[2],
      author_id: userIds[4],
      content: "Прошёл курс «Стартап за 30 дней» — теперь у меня есть чёткий план. Уже запустил MVP для доставки еды в своём районе. Спасибо за контент! 💪",
      is_pinned: false,
    },
  ];

  for (const post of posts) {
    if (!post.community_id || !post.author_id) continue;
    const { error } = await supabase.from("posts").insert(post);
    if (error) {
      console.error(`  Post error:`, error.message);
    }
  }
  console.log("  Created demo posts");

  // 6. Award some points
  const pointsToAward = [
    [userIds[3], communityIds[0], 150],
    [userIds[3], communityIds[1], 80],
    [userIds[4], communityIds[0], 220],
    [userIds[4], communityIds[2], 50],
  ];

  for (const [userId, communityId, pts] of pointsToAward) {
    if (!userId || !communityId) continue;
    await supabase.rpc("award_points", {
      p_user_id: userId,
      p_community_id: communityId,
      p_points: pts,
    });
  }
  console.log("  Awarded points");

  console.log("\n✅ Seed complete!");
  console.log("\nDemo login credentials:");
  console.log("  Creator: aziz@demo.klass.uz / demo1234");
  console.log("  Creator: dinara@demo.klass.uz / demo1234");
  console.log("  Creator: sherzod@demo.klass.uz / demo1234");
  console.log("  Learner: learner1@demo.klass.uz / demo1234");
  console.log("  Learner: learner2@demo.klass.uz / demo1234");
}

seed().catch(console.error);

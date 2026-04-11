/** Only this Google account may sign in and use /blog-create. */
export const BLOG_ADMIN_EMAIL =
  process.env.BLOG_ADMIN_EMAIL?.trim().toLowerCase() ||
  "lariyaharsh88@gmail.com";

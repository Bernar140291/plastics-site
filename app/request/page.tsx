import { permanentRedirect } from "next/navigation";

/* Страница дублировала /contacts той же формой и тем же текстом.
   Оставлена как постоянный редирект, чтобы старые ссылки не ломались,
   а поисковик не видел две почти одинаковые страницы. */
export default function RequestPage() {
  permanentRedirect("/contacts");
}

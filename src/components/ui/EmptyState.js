import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";

export default function EmptyState({ icon="package", title, subtitle, action, actionHref }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4 text-gray-400">
        {typeof icon === "string" ? <Icon name={icon} size={48} /> : icon}
      </div>
      <h3 className="font-bold text-gray-800 mb-1">{title || "Heç nə tapılmadı"}</h3>
      {subtitle && <p className="text-sm text-gray-500 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
      {actionHref && !action && (
        <div className="mt-5">
          <Link href={actionHref} className="btn-primary">
            Geri qayıt
          </Link>
        </div>
      )}
    </div>
  );
}

import { NavLink } from "react-router-dom";

const tabs = [
  { path: "/s/menu-admin", label: "メニュー管理" },
  { path: "/s/analytics", label: "売上分析" },
  { path: "/s/board-admin", label: "掲示板編集" },
];

export default function StaffTabs() {
  return (
    <nav className="flex gap-4 border-b px-4 mb-4">
      {tabs.map((t) => (
        <NavLink
          key={t.path}
          to={t.path}
          className={({ isActive }) =>
            `px-3 py-2 border-b-2 -mb-px ${
              isActive
                ? "border-black font-semibold text-black"
                : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
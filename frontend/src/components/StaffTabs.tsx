import { NavLink } from "react-router-dom";

const tabs = [
  { path: "/s/menu-admin", label: "メニュー管理" },
  { path: "/s/analytics", label: "売上分析" },
  { path: "/s/board-admin", label: "掲示板編集" },
];

export default function StaffTabs() {
  return (
    <nav className="mb-4">
      <div className="grid grid-cols-3 border-b">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) =>
              [
                "relative text-center py-3 font-medium transition-colors",
                isActive
                  ? "text-black after:absolute after:inset-x-0 after:-bottom-[1px] after:h-[2px] after:bg-black"
                  : "text-slate-500 hover:text-black"
              ].join(" ")
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
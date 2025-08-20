"use client";
import React, { useState, useEffect } from 'react';
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [user, setUser] = useState(null); 
  const [loadingUser, setLoadingUser] = useState(true); 
  const [sidebarOpen, setSidebarOpen] = useState(false); // Changed to false for initial collapsed state
  const [isHovering, setIsHovering] = useState(false); // New state for hover effect

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name, role, team_id")
          .eq("id", authUser.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error.message);
        } else if (profile) {
          setUser(profile);
        }
      }
      setLoadingUser(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          fetchUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      router.push("/login?logout=success");
    }
  };

  if (roleLoading || loadingUser) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        Loading dashboard...
      </div>
    );
  }

  const navItems = [
    { name: "Home", href: "/dashboard", roles: ["admin", "team_lead", "procurement_officer", "employee"], icon: '🏠' },
    { name: "Submit Request", href: "/dashboard/requests/submit", roles: ["employee", "admin", "team_lead", "procurement_officer"], icon: '➕' },
    { name: "My Requests", href: "/dashboard/requests/my-requests", roles: ["employee", "team_lead", "procurement_officer"], icon: '📋' },
    { name: "Review Requests", href: "/dashboard/requests/approve", roles: ["team_lead", "admin", "procurement_officer"], icon: '🔍' },
    { name: "Process Requests", href: "/dashboard/requests/process", roles: ["procurement_officer", "admin"], icon: '⚙️' },
    { name: "Create PO", href: "/dashboard/purchase-orders/create", roles: ["procurement_officer", "admin"], icon: '📝' },
    { name: "View POs", href: "/dashboard/purchase-orders/view", roles: ["procurement_officer", "admin"], icon: '👀' },
    { name: "Receive Items", href: "/dashboard/requests/receive", roles: ["procurement_officer", "admin"], icon: '📦' },
    { name: "Payments", href: "/dashboard/payments", roles: ["procurement_officer", "admin"], icon: '💳' },
    { name: "Inventory", href: "/dashboard/inventory", roles: ["procurement_officer", "admin"], icon: '📊' },
    { name: "Manage Vendors", href: "/dashboard/vendors", roles: ["procurement_officer", "admin"], icon: '🤝' },
    { name: "Manage Teams", href: "/dashboard/teams", roles: ["admin"], icon: '👥' },
    { name: "Reports", href: "/dashboard/reports", roles: ["admin", "procurement_officer"], icon: '📈' },
    { name: "Settings", href: "/dashboard/settings", roles: ["admin", "team_lead", "procurement_officer", "employee"], icon: '⚙️' },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  const sidebarDisplayWidth = sidebarOpen || isHovering ? 'w-64' : 'w-20';
  const mainContentMargin = sidebarOpen || isHovering ? 'ml-64' : 'ml-20';
  const showFullSidebarContent = sidebarOpen || isHovering;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white flex flex-col fixed h-full shadow-lg transition-all duration-300 ${sidebarDisplayWidth}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="p-4 border-b border-gray-700 flex justify-end items-center relative">
          <div className={`text-2xl font-bold transition-opacity duration-300 ${showFullSidebarContent ? 'opacity-100 mr-auto text-shadow-light-dark' : 'opacity-0 hidden'}`}>Procure<span className="text-blue-300">Flow</span></div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-white absolute top-1/2 -translate-y-1/2 right-2 z-10"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.name} className="mb-2">
                <Link href={item.href} className="flex items-center p-2 rounded-md hover:bg-gray-700 whitespace-nowrap overflow-hidden">
                  <span className="text-xl mr-3">{item.icon}</span>
                  {showFullSidebarContent && item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full text-left p-2 rounded-md hover:bg-gray-700 whitespace-nowrap overflow-hidden">
            <span className="text-xl mr-3">&#x23FB;</span>
            {showFullSidebarContent && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className={`flex-1 p-8 transition-all duration-300 ${mainContentMargin}`}>
        {children}
      </main>
    </div>
  );
}

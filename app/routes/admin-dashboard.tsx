import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Shield, 
  LogOut,
  Home,
  Calendar,
  Star,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  // Redirect to full admin panel
  throw redirect("/admin");
}

export default function AdminDashboard() {
  // This component will never render due to the redirect
  return null;
}

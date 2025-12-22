import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Form, useSubmit } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Briefcase,
  MapPin,
  Clock,
  Building2
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";

  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "active") {
    where.isActive = true;
    where.isPublished = true;
  } else if (status === "inactive") {
    where.isActive = false;
  } else if (status === "unpublished") {
    where.isPublished = false;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ admin, jobs, search, status });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const jobId = formData.get("jobId") as string;

  if (action === "toggle-active") {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { isActive: !job.isActive },
    });

    return json({ success: true });
  }

  if (action === "toggle-published") {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { isPublished: !job.isPublished },
    });

    return json({ success: true });
  }

  if (action === "delete") {
    await prisma.job.delete({
      where: { id: jobId },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminJobs() {
  const { admin, jobs, search, status } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchValue, setSearchValue] = useState(search);

  const handleToggleActive = (jobId: string) => {
    const formData = new FormData();
    formData.append("action", "toggle-active");
    formData.append("jobId", jobId);
    submit(formData, { method: "post" });
  };

  const handleTogglePublished = (jobId: string) => {
    const formData = new FormData();
    formData.append("action", "toggle-published");
    formData.append("jobId", jobId);
    submit(formData, { method: "post" });
  };

  const handleDelete = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job posting?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("jobId", jobId);
      submit(formData, { method: "post" });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (status !== "all") params.set("status", status);
    navigate(`/admin/jobs?${params.toString()}`);
  };

  const handleStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (newStatus !== "all") params.set("status", newStatus);
    navigate(`/admin/jobs?${params.toString()}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600 mt-1">Manage career opportunities on FindoTrip</p>
        </div>
        <Button
          onClick={() => navigate("/admin/jobs/new")}
          className="bg-[#01502E] hover:bg-[#013d23] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <Form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by title, department, or location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="active">Active & Published</option>
              <option value="inactive">Inactive</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
          <Button type="submit" className="bg-[#01502E] hover:bg-[#013d23] text-white">
            Search
          </Button>
        </Form>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {search || status !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first job posting"}
            </p>
            {!search && status === "all" && (
              <Button
                onClick={() => navigate("/admin/jobs/new")}
                className="bg-[#01502E] hover:bg-[#013d23] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Job
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">
                        Posted {new Date(job.postedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        {job.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {job.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {job.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={job.isActive ? "default" : "secondary"}
                          className={job.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {job.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant={job.isPublished ? "default" : "secondary"}
                          className={job.isPublished ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                        >
                          {job.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Views: {job.viewCount}</div>
                      <div>Applications: {job.applicationCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value={job.isPublished ? "toggle-published" : "toggle-published"} />
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                            onClick={(e) => {
                              e.preventDefault();
                              handleTogglePublished(job.id);
                            }}
                          >
                            {job.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </Form>
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(job.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


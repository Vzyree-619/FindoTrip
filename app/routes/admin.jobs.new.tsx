import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, Form, useActionData } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  return json({ admin });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const type = formData.get("type") as string;
  const description = formData.get("description") as string;
  const applicationEmail = formData.get("applicationEmail") as string || "careers@findotrip.com";
  const applicationUrl = formData.get("applicationUrl") as string || null;
  const salaryRange = formData.get("salaryRange") as string || null;
  const expiresAt = formData.get("expiresAt") as string || null;
  const isActive = formData.get("isActive") === "true";
  const isPublished = formData.get("isPublished") === "true";

  // Parse requirements, responsibilities, and benefits
  const requirements = JSON.parse(formData.get("requirements") as string || "[]");
  const responsibilities = JSON.parse(formData.get("responsibilities") as string || "[]");
  const benefits = JSON.parse(formData.get("benefits") as string || "[]");

  // Validation
  if (!title || !department || !location || !type || !description) {
    return json(
      { error: "Please fill in all required fields" },
      { status: 400 }
    );
  }

  try {
    const job = await prisma.job.create({
      data: {
        title,
        department,
        location,
        type,
        description,
        requirements,
        responsibilities,
        benefits,
        applicationEmail,
        applicationUrl,
        salaryRange,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
        isPublished,
        createdById: admin.id,
        postedAt: new Date(),
      },
    });

    return redirect(`/admin/jobs`);
  } catch (error) {
    console.error("Error creating job:", error);
    return json(
      { error: "Failed to create job posting" },
      { status: 500 }
    );
  }
}

export default function NewJob() {
  const { admin } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [requirementInput, setRequirementInput] = useState("");
  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput("");
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setResponsibilities([...responsibilities, responsibilityInput.trim()]);
      setResponsibilityInput("");
    }
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setBenefits([...benefits, benefitInput.trim()]);
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/jobs")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
        <p className="text-gray-600 mt-1">Add a new career opportunity to the FindoTrip careers page</p>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6 bg-white rounded-lg shadow p-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g., Senior Full Stack Developer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select name="department" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Business Development">Business Development</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Customer Success">Customer Success</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                type="text"
                required
                placeholder="e.g., Remote / Skardu, Pakistan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Job Type *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salaryRange">Salary Range (Optional)</Label>
              <Input
                id="salaryRange"
                name="salaryRange"
                type="text"
                placeholder="e.g., PKR 100,000 - PKR 200,000"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={6}
            placeholder="Describe the role, what makes it exciting, and what the candidate will be working on..."
          />
        </div>

        {/* Requirements */}
        <div>
          <Label>Requirements</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
                placeholder="Add a requirement..."
              />
              <Button type="button" onClick={addRequirement}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{req}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <input type="hidden" name="requirements" value={JSON.stringify(requirements)} />
        </div>

        {/* Responsibilities */}
        <div>
          <Label>Responsibilities</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addResponsibility();
                  }
                }}
                placeholder="Add a responsibility..."
              />
              <Button type="button" onClick={addResponsibility}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {responsibilities.map((resp, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{resp}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResponsibility(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <input type="hidden" name="responsibilities" value={JSON.stringify(responsibilities)} />
        </div>

        {/* Benefits */}
        <div>
          <Label>Benefits</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Add a benefit..."
              />
              <Button type="button" onClick={addBenefit}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{benefit}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBenefit(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <input type="hidden" name="benefits" value={JSON.stringify(benefits)} />
        </div>

        {/* Application Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
          
          <div>
            <Label htmlFor="applicationEmail">Application Email *</Label>
            <Input
              id="applicationEmail"
              name="applicationEmail"
              type="email"
              defaultValue="careers@findotrip.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="applicationUrl">Application URL (Optional)</Label>
            <Input
              id="applicationUrl"
              name="applicationUrl"
              type="url"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          
          <div>
            <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked
                className="rounded border-gray-300"
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPublished"
                value="true"
                defaultChecked
                className="rounded border-gray-300"
              />
              <span>Published (visible on careers page)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/jobs")}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-[#01502E] hover:bg-[#013d23] text-white">
            Create Job Posting
          </Button>
        </div>
      </Form>
    </div>
  );
}


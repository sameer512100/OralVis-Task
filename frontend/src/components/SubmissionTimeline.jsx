import React from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";

const steps = [
  { key: "uploaded", label: "Uploaded", Icon: Clock },
  { key: "annotated", label: "Annotated", Icon: FileText },
  { key: "reported", label: "Reported", Icon: CheckCircle },
];

const formatDate = (value) => {
  if (!value) return "Pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Pending" : date.toLocaleString();
};

const SubmissionTimeline = ({ submission }) => {
  const completedStages = {
    uploaded: submission?.uploadedAt || submission?.createdAt,
    annotated: submission?.annotatedAt,
    reported: submission?.reportedAt,
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Status Timeline</h3>
        <span className="text-xs font-medium text-gray-500 capitalize">
          {submission?.status || "uploaded"}
        </span>
      </div>
      <div className="space-y-3">
        {steps.map(({ key, label, Icon }) => {
          const isComplete = Boolean(completedStages[key]);
          const isActive = submission?.status === key;
          return (
            <div key={key} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border ${
                  isComplete || isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isComplete || isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isComplete || isActive ? "Done" : "Waiting"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{formatDate(completedStages[key])}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubmissionTimeline;

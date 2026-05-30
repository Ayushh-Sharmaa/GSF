export default function ProfileCompletionBar({ percent }: { percent: number }) {
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Profile Completion</span>
        <span className="text-sm font-semibold">{percent}%</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-green-500 rounded transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {percent < 100 && (
        <p className="text-xs text-gray-500 mt-2">
          Complete your profile to improve visibility
        </p>
      )}
    </div>
  );
}
type DashboardCardProps = {
  title: string;
  value: string;
};

export default function DashboardCard({
  title,
  value,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-gray-500">{title}</h3>

      <p className="text-4xl font-bold mt-3">
        {value}
      </p>
    </div>
  );
}
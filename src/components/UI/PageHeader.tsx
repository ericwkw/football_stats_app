type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="py-8 bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center">{title}</h1>
        {description && <p className="text-center mt-2">{description}</p>}
      </div>
    </div>
  );
} 
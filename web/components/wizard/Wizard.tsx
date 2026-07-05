type WizardProps = {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
};

export function Wizard({
  title,
  description,
  currentStep,
  totalSteps,
  children,
}: WizardProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A17A00]">
          Passo {currentStep} de {totalSteps}
        </p>

        <h2 className="mt-2 text-3xl font-bold">{title}</h2>

        <p className="mt-2 text-[#807568]">{description}</p>

        <div className="mt-6 h-3 rounded-full bg-black/10">
          <div
            className="h-3 rounded-full bg-[#F4B400]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}


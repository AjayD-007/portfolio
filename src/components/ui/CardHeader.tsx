import React from "react";
import { Heading, Text } from "./Typography";
import { Badge } from "./Badge";

interface CardHeaderProps {
  title: string;
  subtitle: string;
  badges?: React.ReactNode;
}

export const CardHeader = ({ title, subtitle, badges }: CardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 md:mb-6 w-full">
      <div className="flex flex-col items-start">
        <Heading level={4} variant="card-subtitle">{title}</Heading>
        <Text variant="muted">{subtitle}</Text>
      </div>
      {badges && (
        <div className="flex flex-wrap items-center gap-3 md:gap-4 shrink-0 self-start md:self-center">
          {badges}
        </div>
      )}
    </div>
  );
};

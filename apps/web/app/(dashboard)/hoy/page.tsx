import { TodayClient } from "./TodayClient";

export const metadata = {
  title: "Hoy · Estoicismo Digital",
  description:
    "Tu ritual diario en una sola pantalla — todo lo que tienes que llenar a primera hora.",
};

export default function HoyPage() {
  return <TodayClient />;
}

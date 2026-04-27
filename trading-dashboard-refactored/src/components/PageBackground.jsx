import { BACKGROUNDS } from "../constants";

export default function PageBackground({ design }) {
  const bg = BACKGROUNDS.find(b => b.id === (design.background || "none"));
  return bg?.render(design) ?? null;
}
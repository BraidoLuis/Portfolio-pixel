import { HOUSE_OBJECTS, type HouseInteraction } from "./house-map";

const plant = HOUSE_OBJECTS.find(({ id }) => id === "plant")!;

export type HouseObservation = HouseInteraction & { response: string };
/** Examines existing furniture without adding art, blockers or changing actions. */
export const HOUSE_OBSERVATIONS: readonly HouseObservation[] = [
  { id: "study-table", objectId: "table", x: 480, y: 380, radius: 62,
    label: "Examinar a mesa", sound: "ui-select",
    response: "Um lugar para estudar, testar ideias e transformar curiosidade em projetos." },
  { id: "care-for-plant", objectId: plant.id, x: plant.x, y: plant.y - 8, radius: 112,
    label: "Observar a planta", sound: "ui-select",
    response: "Um pouco de verde entre os estudos. Crescer também pede tempo e cuidado." },
  { id: "look-through-window", objectId: "window", x: 312, y: 252, radius: 62,
    label: "Olhar pela janela", sound: "ui-select",
    response: "Lá fora há caminhos e descobertas. Cada baú guarda uma parte da minha trajetória." },
];

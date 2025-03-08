import { FurnitureItem } from "../../types/furniture";
import i18next from "i18next";

export const translateFurnitureItem = (item: FurnitureItem) => {
    const translatedName = i18next.t(`furniture.${item.name.toLowerCase().replace(/\s+/g, '_')}`);
    const translatedDescription = i18next.t(`furniture.${item.name.toLowerCase().replace(/\s+/g, '_')}_desc`);

    return {
        ...item,
        name: translatedName !== `furniture.${item.name.toLowerCase().replace(/\s+/g, '_')}` ? translatedName : item.name,
        description: translatedDescription !== `furniture.${item.name.toLowerCase().replace(/\s+/g, '_')}_desc` ? translatedDescription : item.description,
    };
}; 
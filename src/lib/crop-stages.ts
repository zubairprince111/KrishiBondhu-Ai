
import { differenceInDays } from 'date-fns';
import type { TranslationKey } from './i18n';

// These are simplified durations. In a real app, these would vary per crop.
const STAGE_DURATIONS = {
  'Seed Sowing': {
    days: 5,
    key: 'myCrops.form.stage.options.seedsowing',
  },
  'Germination & Early Growth': {
    days: 20,
    key: 'myCrops.form.stage.options.germinationandearlygrowth',
  },
  'Vegetative Growth': {
    days: 40,
    key: 'myCrops.form.stage.options.vegetativegrowth',
  },
  'Flowering & Fruiting': {
    days: 30,
    key: 'myCrops.form.stage.options.floweringandfruiting',
  },
  'Harvesting': {
    days: 15,
    key: 'myCrops.form.stage.options.harvesting',
  },
  'Post-Harvest': {
    days: Infinity,
    key: 'myCrops.form.stage.options.postharvest',
  },
};

type StageName = keyof typeof STAGE_DURATIONS;

/**
 * Calculates the current growth stage of a crop based on its sowing date.
 * @param sowingDate - The date the crop was sown.
 * @returns The current stage name and its translation key.
 */
export function getGrowthStage(sowingDate: Date): { stage: StageName; stageKey: TranslationKey } {
  const daysSinceSowing = differenceInDays(new Date(), sowingDate);

  let cumulativeDays = 0;
  for (const stage in STAGE_DURATIONS) {
    const stageName = stage as StageName;
    cumulativeDays += STAGE_DURATIONS[stageName].days;
    if (daysSinceSowing < cumulativeDays) {
      return {
        stage: stageName,
        stageKey: STAGE_DURATIONS[stageName].key as TranslationKey,
      };
    }
  }

  // Default to Post-Harvest if something goes wrong
  return {
    stage: 'Post-Harvest',
    stageKey: 'myCrops.form.stage.options.postharvest',
  };
}

    
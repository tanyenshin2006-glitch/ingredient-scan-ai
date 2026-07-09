import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios'
import { embed } from './ollama.js';

const ingredients = [
  {
    name: 'Vitamin C',
    description: 'Water-soluble vitamin found naturally in citrus fruits and vegetables',
    safety_notes: 'Check which form is used — Ascorbic Acid (synthetic), Sodium Ascorbate (buffered), or Acerola Cherry (natural). Form determines bioavailability and suitability',
    is_common_allergen: false,
    category: 'vitamin',
    severity: 'safe',
  },
  {
    name: 'Liposomal Vitamin C',
    description: 'Ascorbic Acid encapsulated in liposomes (phospholipid spheres) for enhanced absorption. The Vitamin C itself is still synthetic — the liposome is the delivery innovation, not the source.',
    safety_notes: 'Higher bioavailability than standard Ascorbic Acid — liposomal delivery bypasses digestive breakdown. Generally safe. Premium form found in higher-end supplements. Still synthetic origin despite the advanced delivery system.',
    is_common_allergen: false,
    category: 'vitamin',
    severity: 'safe',
  },
  {
    name: 'Ascorbic Acid',
    description: 'Synthetic form of Vitamin C produced industrially via glucose fermentation. Glucose is typically sourced from corn (often GMO) or beet sugar.',
    safety_notes: 'Molecularly identical to natural Vitamin C but not derived from whole food sources. Generally safe — high doses above 2000mg may cause digestive discomfort.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Natural Acerola Cherry Concentrate',
    description: 'Concentrated extract from Acerola Cherry, one of the richest natural sources of Vitamin C.',
    safety_notes: 'Natural whole food source of Vitamin C. Generally safe. May contain traces of naturally occurring sugars.',
    category: 'whole_food',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Citrus Bioflavonoids',
    description: 'Plant compounds naturally found in the peel and pulp of citrus fruits, commonly paired with Vitamin C to enhance absorption.',
    safety_notes: 'Generally safe. May enhance Vitamin C bioavailability. No known risks at normal supplement doses.',
    category: 'extract',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Magnesium Stearate',
    description: 'Lubricant used in tablet manufacturing to prevent ingredients from sticking to machinery during production.',
    safety_notes: 'No nutritional value — added purely for manufacturing convenience. Typically derived from cottonseed oil (often GMO) or animal fat — caution for vegans. Some studies suggest it may reduce nutrient absorption by forming a biofilm in the gut.',
    category: 'lubricant',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Microcrystalline Cellulose',
    description: 'Refined wood pulp used as a binder and filler in tablets and capsules to hold ingredients together.',
    safety_notes: 'Generally safe. Inert — passes through the body without absorption. No nutritional value, added purely for manufacturing purposes. No known health risks at normal supplement doses.',
    category: 'binder',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Maltodextrin',
    description: 'Highly processed starch derived from corn, wheat, or potato, used as a filler and bulking agent in tablets and powders.',
    safety_notes: 'High glycaemic index — can spike blood sugar faster than table sugar. Often derived from GMO corn. May negatively affect gut microbiome with regular consumption. Caution for diabetics and those with insulin sensitivity.',
    category: 'filler',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Silicon Dioxide',
    description: 'Naturally occurring mineral compound used as an anticaking agent to prevent powders and tablets from clumping together.',
    safety_notes: 'Generally recognised as safe (GRAS) by the FDA at normal dietary doses. Passes through the body without absorption. High doses in nanoparticle form may raise concerns — studies ongoing. At typical supplement quantities, considered safe.',
    category: 'anticaking_agent',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Hydroxypropyl Methylcellulose',
    description: 'Semi-synthetic polymer derived from cellulose, used as a tablet coating and vegetarian capsule material. Also known as HPMC or Hypromellose.',
    safety_notes: 'Generally safe. Widely used as a vegetarian and vegan alternative to gelatin capsules. Inert — not absorbed by the body. No known health risks at normal supplement doses.',
    category: 'coating',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Glycerin',
    description: 'Natural compound derived from plant or animal fats, used as a humectant to retain moisture in tablets and capsules.',
    safety_notes: 'Generally safe. Source matters — can be derived from animal fat (not suitable for vegans) or plant-based sources such as palm or soy oil. Check label for vegan certification if required.',
    category: 'humectant',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Carnauba Wax',
    description: 'Natural wax derived from the leaves of the Carnauba palm tree (Copernicia prunifera), native to Brazil. Used as a tablet coating to give a smooth, shiny finish.',
    safety_notes: 'Generally safe. Natural plant-based ingredient — suitable for vegans. Used in food, supplements, and cosmetics. No known health risks at normal doses.',
    category: 'coating',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Methyl Cellulose',
    description: 'Semi-synthetic cellulose derivative used as a binder, thickener, and coating agent in tablets and capsules.',
    safety_notes: 'Generally safe. Inert — not absorbed by the body. Commonly used as a vegetarian and vegan alternative to gelatin. No known health risks at normal supplement doses.',
    category: 'binder',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Folic Acid',
    description: 'Synthetic form of Vitamin B9, used in supplements and fortified foods. The natural form found in food is called Folate.',
    safety_notes: 'Synthetic form — requires conversion by the body to active methylfolate. People with MTHFR gene variant cannot convert efficiently, leading to unmetabolised folic acid buildup. Prefer Methylfolate if you have MTHFR. Essential for pregnancy — prevents neural tube defects.',
    category: 'vitamin',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Niacin',
    description: 'Vitamin B3, essential for energy metabolism, DNA repair, and cellular signalling. Found naturally in meat, fish, and nuts.',
    safety_notes: 'Generally safe at normal dietary doses. High doses (above 500mg) may cause niacin flush — temporary skin redness, tingling, and warmth. Very high doses (above 3000mg) may cause liver damage. Supplement doses are typically safe.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Thiamine',
    description: 'Vitamin B1, essential for energy metabolism and proper nerve function. Found naturally in whole grains, legumes, and meat.',
    safety_notes: 'Generally safe. Water-soluble — excess is excreted through urine, not stored in body. No known toxicity at normal supplement doses. Common forms: Thiamine Hydrochloride (most common, synthetic), Thiamine Mononitrate (synthetic, more stable), Benfotiamine (fat-soluble, better absorbed, preferred for nerve health).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Riboflavin',
    description: 'Vitamin B2, essential for energy production, cell growth, and metabolism of fats, proteins, and carbohydrates. Found naturally in eggs, meat, dairy, and leafy greens.',
    safety_notes: 'Generally safe. Water-soluble — excess is excreted through urine, which may turn bright yellow. This is harmless. No known toxicity at normal supplement doses. Common forms: Riboflavin (standard synthetic) and Riboflavin-5-Phosphate (active form, better absorbed).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Pantothenic Acid',
    description: 'Vitamin B5, essential for synthesising coenzyme A, energy metabolism, and production of hormones and red blood cells. Found naturally in meat, eggs, legumes, and whole grains.',
    safety_notes: 'Generally safe. Water-soluble — excess excreted through urine. No known toxicity at normal supplement doses. Common forms: Pantothenic Acid (standard) and Calcium Pantothenate (most common supplement form, more stable). Both are synthetic but well absorbed.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Pyridoxine',
    description: 'Vitamin B6, essential for protein metabolism, neurotransmitter synthesis, and immune function. Found naturally in poultry, fish, potatoes, and bananas.',
    safety_notes: 'Generally safe at normal doses. High doses above 100mg daily long term may cause peripheral neuropathy — nerve damage causing numbness and tingling in hands and feet. Common forms: Pyridoxine Hydrochloride (most common, synthetic) and Pyridoxal-5-Phosphate (P5P, active form, better absorbed, preferred for those with liver issues).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Cyanocobalamin',
    description: 'Synthetic form of Vitamin B12, the most common and cheapest form used in supplements and fortified foods.',
    safety_notes: 'Generally safe at normal doses. Contains a small cyanide molecule — released during metabolism, but the amount is negligible and considered safe. Requires conversion to active forms (Methylcobalamin or Adenosylcobalamin) in the body. Less bioavailable than Methylcobalamin. Not ideal for people with kidney disease or those with MTHFR gene variant.',
    category: 'vitamin',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Inositol',
    description: 'A naturally occurring sugar alcohol found in cell membranes, involved in cell signalling, insulin sensitivity, and neurotransmitter function. Found naturally in fruits, beans, grains, and nuts.',
    safety_notes: 'Generally safe at normal doses. High doses (above 12g daily) may cause mild digestive discomfort — nausea, diarrhoea, stomach cramps. Common forms: Myo-Inositol (most studied, supports insulin sensitivity and PCOS) and D-Chiro-Inositol (works synergistically with Myo-Inositol). Often used for mental health, PCOS, and fertility support.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Para-Aminobenzoic Acid',
    description: 'Also known as PABA, a compound found naturally in certain foods and produced by gut bacteria. Sometimes grouped with B vitamins but not officially classified as one. Used in supplements for skin and hair health.',
    safety_notes: 'Generally safe at low doses. High doses above 400mg daily may cause nausea, skin rash, and liver toxicity with long term use. Historically used in sunscreens but largely phased out due to allergic reactions. Caution for people with sulphonamide antibiotic sensitivity as PABA may reduce their effectiveness.',
    category: 'vitamin',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Dicalcium Phosphate',
    description: 'Calcium salt of phosphoric acid, used as a filler and calcium source in tablets and capsules. One of the most common tablet fillers in the supplement industry.',
    safety_notes: 'Generally safe at normal supplement doses. Provides some calcium but poorly absorbed compared to Calcium Citrate or Calcium Glycinate. Often used as a cheap filler rather than a meaningful calcium source. Caution for people with kidney disease — excess phosphate may be harmful.',
    category: 'filler',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Lactose',
    description: 'Natural sugar found in milk and dairy products, commonly used as a filler and binder in tablets and capsules.',
    safety_notes: 'Generally safe for most people. Contains dairy — not suitable for vegans. People with lactose intolerance lack the enzyme lactase to digest it, causing bloating, gas, and diarrhoea. Often used as a cheap filler in supplements — check label if lactose intolerant or vegan.',
    category: 'filler',
    severity: 'caution',
    is_common_allergen: true,
  },
  {
    name: 'Calcium Stearate',
    description: 'Calcium salt of stearic acid, used as a lubricant and anticaking agent in tablet manufacturing. Similar function to Magnesium Stearate.',
    safety_notes: 'Generally safe at normal supplement doses. No nutritional value — added purely for manufacturing convenience. Can be derived from animal fat (not suitable for vegans) or plant-based sources. Similar concerns to Magnesium Stearate — may slightly reduce nutrient absorption.',
    category: 'lubricant',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B1',
    description: 'Generic Vitamin B1 — form not specified on label. Also known as Thiamine.',
    safety_notes: 'Check which form is used — Thiamine Hydrochloride (most common, synthetic), Thiamine Mononitrate (synthetic, more stable), or Benfotiamine (fat-soluble, better absorbed, preferred for nerve health).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B2',
    description: 'Generic Vitamin B2 — form not specified on label. Also known as Riboflavin.',
    safety_notes: 'Check which form is used — Riboflavin (standard synthetic) or Riboflavin-5-Phosphate (active form, better absorbed).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B3',
    description: 'Generic Vitamin B3 — form not specified on label. Also known as Niacin.',
    safety_notes: 'Check which form is used — Niacin (may cause flush), Niacinamide (no flush), or Inositol Hexanicotinate (flush-free). Forms have different effects.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B5',
    description: 'Generic Vitamin B5 — form not specified on label. Also known as Pantothenic Acid.',
    safety_notes: 'Check which form is used — Pantothenic Acid (standard) or Calcium Pantothenate (more stable, most common in supplements).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B6',
    description: 'Generic Vitamin B6 — form not specified on label. Also known as Pyridoxine.',
    safety_notes: 'Check which form is used — Pyridoxine Hydrochloride (most common, synthetic) or Pyridoxal-5-Phosphate (P5P, active form, better absorbed). High doses above 100mg daily long term may cause nerve damage.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B9',
    description: 'Generic Vitamin B9 — form not specified on label. Also known as Folate or Folic Acid.',
    safety_notes: 'Check which form is used — Folic Acid (synthetic, requires conversion) or Methylfolate (active form, preferred especially for those with MTHFR gene variant). Essential for pregnancy.',
    category: 'vitamin',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Vitamin B12',
    description: 'Generic Vitamin B12 — form not specified on label. Also known as Cobalamin.',
    safety_notes: 'Check which form is used — Cyanocobalamin (cheapest, synthetic, contains trace cyanide), Methylcobalamin (active form, preferred), or Adenosylcobalamin (active form, energy metabolism).',
    category: 'vitamin',
    severity: 'caution',
    is_common_allergen: false,
  },
];

async function seed() {
  for (const ingredient of ingredients) {
    const embedding = await embed(ingredient.name);

    if (!embedding) {
      console.error(`Failed to embed: ${ingredient.name}`);
      continue;
    }

    await axios.post(`${process.env.BE_SERVICE_URL}/api/ingredients`, {
      ...ingredient,
      embedding
      }, 
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY } }
    );

    console.log(`Saved ${ingredient.name}`);
  }
  console.log('Seeding complete')
}

seed().catch(console.error);
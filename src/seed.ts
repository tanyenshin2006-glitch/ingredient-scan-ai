import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios'
import { embed } from './ollama.js';

const ingredients = [

  // ── Vitamin B1 family ──────────────────────────────────────────────
  {
    name: 'Thiamine',
    description: 'Also known as Vitamin B1. Water-soluble vitamin that serves as a coenzyme (Thiamine Pyrophosphate, TPP) in energy metabolism — essential for converting carbohydrates into energy, and for the function of the nervous system and heart. Found in whole grains, legumes, and meat. Deficiency causes Beriberi (peripheral neuropathy, heart failure) and Wernicke-Korsakoff syndrome (seen in chronic alcoholism).',
    safety_notes: 'Safe — no known toxicity at supplement doses. Water-soluble; excess is excreted in urine. No established upper tolerable intake level. At typical supplement doses (1–100mg), very well tolerated. People at risk of deficiency: chronic alcohol users (alcohol blocks thiamine absorption), people on very high carbohydrate diets with low thiamine intake, patients on long-term diuretics, those with malabsorption conditions. IV Thiamine is used in emergency treatment of Wernicke encephalopathy.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Thiamine HCl',
    description: 'Thiamine Hydrochloride — the most common supplemental and pharmaceutical form of Vitamin B1. The hydrochloride salt form of Thiamine, highly water-soluble and stable. Used in B-complex vitamins, multivitamins, food fortification, and pharmaceutical injectable preparations. Bioavailable and well absorbed at normal doses; absorption becomes saturated at higher oral doses.',
    safety_notes: 'Safe — same excellent safety profile as Thiamine. No known toxicity at oral supplement doses. Rare cases of anaphylaxis reported with high-dose intravenous Thiamine HCl injection (not oral). At typical oral supplement doses (1–100mg), very well tolerated. High-dose oral Thiamine HCl is used clinically (300–1500mg/day) for thiamine-responsive conditions under medical supervision.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Benfotiamine',
    description: 'A fat-soluble synthetic derivative of Thiamine (Vitamin B1). Unlike water-soluble Thiamine HCl, Benfotiamine has significantly higher bioavailability — achieves much higher blood and tissue levels of Thiamine than equivalent doses of water-soluble forms. Primarily studied for prevention and treatment of diabetic complications (neuropathy, retinopathy, nephropathy) by reducing advanced glycation end-products (AGEs). Also researched for Alzheimer\'s disease, where thiamine deficiency is implicated.',
    safety_notes: 'Safe — well tolerated in clinical studies at doses up to 600mg/day. No significant adverse effects reported. Not a natural food constituent — synthetic form only found in supplements. Should not replace treatment for thiamine deficiency in acute Wernicke encephalopathy (water-soluble IV Thiamine is required for acute treatment). Generally used as a preventive supplement for people with diabetes or at risk of thiamine-related nerve damage.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B2 family ──────────────────────────────────────────────
  {
    name: 'Riboflavin',
    description: 'Also known as Vitamin B2. Water-soluble vitamin that serves as a precursor to FAD (Flavin Adenine Dinucleotide) and FMN (Flavin Mononucleotide) coenzymes — essential for cellular energy production, fatty acid oxidation, and the metabolism of other B vitamins including B6, folate, and niacin. Gives its characteristic yellow-orange colour to supplements and turns urine bright yellow at higher doses (harmless). At high doses (400mg/day), shown to reduce migraine frequency.',
    safety_notes: 'Safe — no known toxicity. Water-soluble; excess excreted in urine, causing bright yellow discolouration (riboflavinuria) — harmless and expected. No established upper tolerable intake level. Very well tolerated at all supplement doses. High-dose Riboflavin (400mg/day) is used for migraine prophylaxis — safe for long-term use at this dose. May slightly reduce the effectiveness of certain antibiotics (tetracyclines) if taken simultaneously — space apart by 2 hours.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Riboflavin-5-Phosphate',
    description: 'Also known as FMN (Flavin Mononucleotide). The active phosphorylated form of Riboflavin (Vitamin B2) — used directly by the body as a coenzyme without requiring conversion. More bioavailable than free Riboflavin, particularly for people with compromised gut absorption. Converted in cells to FAD (Flavin Adenine Dinucleotide) for use in the electron transport chain and oxidative phosphorylation.',
    safety_notes: 'Safe — same excellent safety profile as Riboflavin. No known toxicity. Will cause bright yellow urine (harmless). Better absorbed than standard Riboflavin in people with impaired gut function. No established upper tolerable intake level. Well tolerated at all supplement doses.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B5 family ──────────────────────────────────────────────
  {
    name: 'Pantothenic Acid',
    description: 'Also known as Vitamin B5. Water-soluble vitamin essential for the synthesis of Coenzyme A (CoA) — a critical molecule for fatty acid metabolism, the citric acid cycle, and synthesis of cholesterol, steroid hormones, and neurotransmitters. The name derives from the Greek "pantos" meaning everywhere — it is found in virtually all foods and dietary deficiency is extremely rare. Used in supplements for energy, adrenal support, and acne.',
    safety_notes: 'Safe — one of the safest vitamins. No known toxicity even at very high doses. Virtually impossible to be deficient from food. At very high doses (10–20g/day), may cause diarrhoea and GI upset. No established upper tolerable intake level. Water-soluble; excess excreted in urine. Well tolerated at all standard supplement doses. High-dose Pantothenic Acid (1–3g/day) is used for acne with generally good tolerability.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Calcium Pantothenate',
    description: 'The calcium salt form of Pantothenic Acid (Vitamin B5) — the most common form used in dietary supplements and food fortification due to its superior stability compared to free Pantothenic Acid. Converted to free Pantothenic Acid in the intestine before absorption. Functionally identical to Pantothenic Acid once absorbed. Found in most B-complex vitamins and multivitamins.',
    safety_notes: 'Safe — same excellent safety profile as Pantothenic Acid. No known toxicity at supplement doses. The calcium content is negligible relative to daily calcium requirements — not a meaningful calcium source. Well tolerated at all standard supplement doses. May cause GI upset at very high doses (>10g/day).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Panthenol',
    description: 'Also known as D-Panthenol, Dexpanthenol, or Provitamin B5. The alcohol analogue of Pantothenic Acid — converted to Pantothenic Acid in the body. Used extensively in skincare (moisturiser, wound healing, barrier repair) and haircare (shine, elasticity) products. Also used orally in supplements as an alternative to Pantothenic Acid. The D-form (Dexpanthenol) is the biologically active form.',
    safety_notes: 'Safe — well tolerated topically and orally. No known systemic toxicity. Topical application: very rare contact allergy reported — patch test if history of sensitive skin. Oral use: same safety profile as Pantothenic Acid. Intravenous Dexpanthenol is used medically for post-operative bowel paralysis (paralytic ileus) — safe under medical supervision. Do not confuse with Panthenine (a different compound used for cholesterol).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B7 family ──────────────────────────────────────────────
  {
    name: 'Biotin',
    description: 'Also known as Vitamin B7, Vitamin H, or Coenzyme R. Water-soluble vitamin that serves as a coenzyme for carboxylase enzymes — essential for fatty acid synthesis, gluconeogenesis, and amino acid metabolism. Widely used in supplements for hair, skin, and nail health, though evidence for this in people without deficiency is limited. Found in eggs (especially yolk), nuts, seeds, and organ meats. Raw egg whites contain avidin, which blocks biotin absorption.',
    safety_notes: 'Safe — no known toxicity at supplement doses. No established upper tolerable intake level. CRITICAL LAB INTERFERENCE: High-dose Biotin supplementation (>5mg/day, common in "hair and nail" supplements containing 5–10mg) causes false results in many immunoassay laboratory tests — including thyroid function (TSH, T3, T4), cardiac troponin (heart attack marker), hormone tests, and vitamin D levels. Multiple reports of misdiagnosis due to Biotin interference. Always inform your doctor and stop Biotin at least 3–7 days before blood tests. The FDA has issued safety communications about this risk. Raw egg white consumption blocks Biotin absorption (avidin protein binds Biotin).',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B3 family ──────────────────────────────────────────────
  {
    name: 'Vitamin B3',
    description: 'Generic umbrella term for the Vitamin B3 family. Covers both Niacin (Nicotinic Acid) and Niacinamide (Nicotinamide). Both are precursors to NAD+ and NADP+ coenzymes essential for energy metabolism, but they have distinct effects — Niacin lowers cholesterol and causes skin flushing; Niacinamide does not flush and is used for skin health and NAD+ support. When a label says "Vitamin B3" without specifying the form, the exact compound is unknown.',
    safety_notes: 'Safe at typical supplement doses. Safety profile varies by form — see Niacin or Niacinamide entries for specific warnings. Water-soluble; excess excreted in urine.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Niacin',
    description: 'Also known as Nicotinic Acid. The acid form of Vitamin B3. A potent vasodilator — causes "niacin flush" (skin redness, tingling, itching) at doses above 50mg. At high prescription doses (1–2g/day) is one of the most effective treatments for raising HDL cholesterol and lowering triglycerides. Also a precursor to NAD+ for cellular energy production.',
    safety_notes: 'Caution — significant dose-dependent risks. Skin flushing is harmless but uncomfortable — starts around 50mg and peaks 15–30 minutes after ingestion; aspirin 30 minutes before can reduce flushing. High-dose Niacin (1–2g/day for cholesterol) should only be used under medical supervision — associated with hepatotoxicity (especially extended-release formulations), hyperglycaemia, hyperuricaemia (gout flares), and worsening of peptic ulcers. Extended-release Niacin has a higher liver toxicity risk than immediate-release. May interact with statins (myopathy risk). At typical supplement doses (15–50mg), very safe.',
    category: 'vitamin',
    severity: 'caution',
    is_common_allergen: false,
  },
  {
    name: 'Niacinamide',
    description: 'Also known as Nicotinamide. The amide form of Vitamin B3. Does NOT cause skin flushing unlike Niacin. Primary uses: NAD+ precursor for cellular energy and DNA repair, skin health (reduces acne, hyperpigmentation, improves barrier function), and as a precursor for NADH in energy metabolism. Common in skincare supplements and B-complex vitamins.',
    safety_notes: 'Safe — one of the better-tolerated forms of Vitamin B3. At typical supplement doses (15–500mg) very well tolerated. At very high doses (>3g/day) may cause nausea, vomiting, liver toxicity, and glucose intolerance. May flush less than Niacin but at extremely high doses some flushing possible. No significant drug interactions at normal doses. Does not share Niacin\'s cholesterol-lowering effect. Very safe for skin health applications at 500mg/day or less.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B6 family ──────────────────────────────────────────────
  {
    name: 'Vitamin B6',
    description: 'Generic umbrella term for the Vitamin B6 family. Covers Pyridoxine (most common supplement form), Pyridoxal-5-Phosphate (P5P — the active coenzyme form), and Pyridoxamine. All forms support amino acid metabolism, neurotransmitter synthesis (serotonin, dopamine, GABA), red blood cell production, and homocysteine regulation. When a label says "Vitamin B6" without specifying the form, the exact compound is unknown.',
    safety_notes: 'Safe at typical supplement doses (1–10mg). High-dose supplementation above 100–200mg/day has caused peripheral neuropathy (numbness, tingling in hands and feet) — only relevant for standalone high-dose B6 supplements, not standard B-complex products. Symptoms are usually reversible on stopping.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Pyridoxine',
    description: 'The most common supplemental form of Vitamin B6 — specifically Pyridoxine Hydrochloride (Pyridoxine HCl) in most products. Must be converted by the liver to Pyridoxal-5-Phosphate (P5P) to become metabolically active. Used in B-complex vitamins, prenatal supplements, and for morning sickness (as Pyridoxine HCl with Doxylamine). Essential for amino acid metabolism, neurotransmitter production, and haemoglobin synthesis.',
    safety_notes: 'Safe at typical supplement doses (1–25mg). Most cases of B6-induced neuropathy have occurred with Pyridoxine at doses exceeding 200mg/day — only relevant for high-dose standalone supplements. Symptoms: numbness, burning, tingling in hands and feet. Reversible on stopping in most cases.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Pyridoxine HCl',
    description: 'Pyridoxine Hydrochloride — the hydrochloride salt form of Pyridoxine (Vitamin B6). The most commonly used form of B6 in supplements and food fortification due to its stability. Virtually all supplement labels that say "Vitamin B6 (as Pyridoxine HCl)" contain this form. Must be converted by the liver to Pyridoxal-5-Phosphate (P5P) to become metabolically active.',
    safety_notes: 'Safe at typical supplement doses (1–25mg). The same neuropathy risk as Pyridoxine applies at very high doses (>200mg/day) — not relevant at standard supplement amounts. Well tolerated by the vast majority of people at doses found in multivitamins and B-complex products.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Pyridoxal 5-Phosphate',
    description: 'Also known as P5P or PLP. The active coenzyme form of Vitamin B6 — used directly by the body without conversion. Involved in over 100 enzyme reactions including amino acid metabolism, neurotransmitter synthesis (serotonin, dopamine, norepinephrine, GABA), and haemoglobin production. Preferred by people with liver conditions or those who cannot efficiently convert Pyridoxine to P5P.',
    safety_notes: 'Safe — lower neuropathy risk than Pyridoxine. At typical supplement doses (10–50mg/day), well tolerated. High-dose use above 200mg/day should be avoided long-term. Do not combine high-dose Pyridoxine and P5P supplements simultaneously.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B9 family ──────────────────────────────────────────────
  {
    name: 'Folate',
    description: 'Generic umbrella term for the Vitamin B9 (folate) family — the name used on supplement and food labels. Covers Folic Acid (synthetic form used in fortification), Methylfolate/5-MTHF (active form), and Folinic Acid. All forms support DNA synthesis, cell division, red blood cell production, and homocysteine regulation. Critical during pregnancy to prevent neural tube defects. The form matters — people with MTHFR gene variants cannot efficiently convert Folic Acid to the active form. When a label says "Folate" or "Vitamin B9" without specifying the form, the exact compound is unknown.',
    safety_notes: 'Safe at normal doses. High-dose Folic Acid (above 1mg/day) can mask Vitamin B12 deficiency — neurological damage continues even as anaemia corrects. Always check B12 status before starting high-dose folate. People with MTHFR mutations should prefer Methylfolate over Folic Acid.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Folic Acid',
    description: 'The synthetic oxidised form of Vitamin B9, used in food fortification and most standard supplement products. Must be converted to dihydrofolate then tetrahydrofolate and finally 5-methyltetrahydrofolate (active form) before use. The most studied and regulated form of folate — government-mandated in flour and cereals in many countries to prevent neural tube defects. Essential for DNA synthesis, cell division, and red blood cell production.',
    safety_notes: 'Safe at recommended doses. High intake (above 1mg/day) can mask Vitamin B12 deficiency — folic acid corrects megaloblastic anaemia but allows B12 neuropathy to progress undetected. People with MTHFR C677T or A1298C gene variants have reduced ability to convert Folic Acid — unmetabolised folic acid (UMFA) may accumulate in blood. These individuals should prefer Methylfolate. 400–800mcg/day recommended for women planning pregnancy and in the first trimester to prevent neural tube defects. At standard doses, well tolerated.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Methylfolate',
    description: 'Also known as L-5-Methyltetrahydrofolate (L-5-MTHF), 5-MTHF, or L-Methylfolate. The active, bioavailable form of Vitamin B9 that crosses the blood-brain barrier and is used directly by cells without conversion. The preferred form for people with MTHFR gene mutations (C677T, A1298C) who cannot efficiently convert Folic Acid. Patented forms include Quatrefolic and Metafolin. Supports methylation, neurotransmitter synthesis, and homocysteine regulation.',
    safety_notes: 'Safe — and preferred over Folic Acid for people with MTHFR variants. In a small subset of individuals, initiating Methylfolate supplementation can cause anxiety, irritability, or insomnia — especially those with certain psychiatric conditions or who are undermethylated/overmethylated. Start with a low dose and increase gradually. Does not cause unmetabolised folate accumulation unlike Folic Acid. Safe in pregnancy. No established upper limit but doses above 1mg/day are generally unnecessary unless directed by a practitioner.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  // ── Vitamin B12 family ─────────────────────────────────────────────
  {
    name: 'Vitamin B12',
    description: 'Generic umbrella term for the cobalamin family. Covers Cyanocobalamin (synthetic, most stable), Methylcobalamin (active form), Adenosylcobalamin (mitochondrial active form), and Hydroxocobalamin (injectable form). All forms support nerve function, DNA synthesis, red blood cell production, and methylation. Essential for vegetarians and vegans who have no dietary source. When a label says "Vitamin B12" without specifying the form, the exact compound is unknown.',
    safety_notes: 'Safe — no established upper tolerable intake level. Excess excreted in urine. Even at very high doses (1000–2000mcg), B12 has not been shown to cause toxicity in healthy people. B12 deficiency is common in vegans, vegetarians, older adults, and people on long-term Metformin or proton pump inhibitors — these groups should supplement regularly.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Cyanocobalamin',
    description: 'The synthetic form of Vitamin B12, most commonly used in supplements and food fortification due to its superior stability and low cost. Contains a cyanide molecule that is cleaved during metabolism — the cyanide released is negligible and harmless for most people. Must be converted in the body to Methylcobalamin and Adenosylcobalamin (the active forms) before use. The most studied form of B12 with decades of safety data.',
    safety_notes: 'Safe — the amounts of cyanide released from Cyanocobalamin are far below toxic levels. However, people with rare cyanide metabolism disorders (Leber hereditary optic neuropathy) should avoid Cyanocobalamin and use Methylcobalamin or Hydroxocobalamin instead. People who smoke heavily may have reduced ability to metabolise the cyanide component. Requires conversion to active forms — individuals with certain genetic variants may prefer Methylcobalamin. At any standard supplement dose, very well tolerated.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Methylcobalamin',
    description: 'The active methylated form of Vitamin B12 — used directly in methylation reactions and for maintaining the myelin sheath protecting nerve fibres. The primary B12 form found in human blood and tissues. Does not require conversion unlike Cyanocobalamin. Preferred form for neurological support and for people with conditions affecting B12 metabolism. Supports methylation cycle together with Methylfolate.',
    safety_notes: 'Safe — no established upper tolerable intake level. Well tolerated at all standard supplement doses. Preferred over Cyanocobalamin for people with Leber optic neuropathy, heavy smokers, and those with neurological conditions. May be better retained in tissues than Cyanocobalamin in some studies. Safe for vegans and vegetarians as a dietary supplement. No known drug interactions at standard doses.',
    category: 'vitamin',
    severity: 'safe',
    is_common_allergen: false,
  },
  {
    name: 'Adenosylcobalamin',
    description: 'Also known as Ado-B12 or Cobamamide. One of the two active coenzyme forms of Vitamin B12 (alongside Methylcobalamin). Primarily active in mitochondria — essential for converting methylmalonyl-CoA to succinyl-CoA in the citric acid cycle. Less commonly found in supplements than Cyanocobalamin or Methylcobalamin but increasingly available in active B12 products. Often combined with Methylcobalamin for complete B12 coverage.',
    safety_notes: 'Safe — same excellent safety profile as other B12 forms. No established upper tolerable intake level. Light-sensitive — degrades when exposed to light, which is why it is less shelf-stable than Cyanocobalamin. Well tolerated at standard supplement doses. Recommended alongside Methylcobalamin for people wanting complete B12 support covering both the methylation pathway (Methylcobalamin) and the mitochondrial pathway (Adenosylcobalamin).',
    category: 'vitamin',
    severity: 'safe',
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

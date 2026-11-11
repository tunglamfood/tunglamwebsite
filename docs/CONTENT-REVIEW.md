# Content to confirm before launch

All website copy was rewritten in English, Bahasa Malaysia and Chinese. It sticks to facts from the old site and the product packaging. Please have someone at Tung Lam confirm the points below.

## Packaging and product questions

1. **TL Fish Paste 400gm** (`tl-fish-paste-400gm`): the photo shows **AD-branded** packaging ("Fresh Fish Paste – Kuih Ikan Mentah") that seems to name another maker, "Perusahaan Makanan Al Din". Which brand and manufacturer are correct?
2. **TL Bebola Goreng "Cecil" 1kg:** the pack reads "Bebola Ikan Goreng **Kecil**". The display names now say *Kecil*. Can the URL slug change too?
3. **Lingo Kek Ikan 1kg:** what does "Lingo" mean? The copy currently describes the product only from its photo.
4. **TauFu TeoChew 350gm:** the pack carries its own logo rather than the TL logo. Which brand is it?
5. **TL Cincau Asli 2kg:** is it sweetened or unsweetened? The copy only says "original".
6. **Warisan Cendol:** is "Warisan" its own brand, or a Tung Lam product line?
7. **Silken Tofu Tube 250gm:** confirm the Chinese name 山水嫩豆腐.

## Company claims

- **Certifications:** the site states Halal, HACCP, GMP and MeSTI, based on the badges shown on the old site. Please confirm each one is current. If not, remove it in `src/components/ui/cert-badges.tsx` and in the dictionaries.
- **Chinese company name:** 東臨食品工業有限公司 (东临食品), taken from the packaging.
- **Careers email:** applications go to the same enquiry inbox. Does HR have a separate email address?
- **Business hours:** none are listed yet. Add them in `src/i18n/dictionaries/*.ts` (`contact.hoursText`).
- **Social media links:** none were found on the old site. Send the Facebook, Instagram or TikTok links if they exist, and they will be added to the footer and the structured data `sameAs` field.

## Images

- The product photos are the original packaging photos, converted to WebP.
- The hero, series, craft and wholesale images are **AI-generated** with Kie GPT Image 2.6. They are illustrative food scenes, not the Tung Lam factory. Real factory and team photos would strengthen trust and E-E-A-T.

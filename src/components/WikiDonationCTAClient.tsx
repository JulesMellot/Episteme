import { WikiDonationCTA } from "@/components/WikiDonationCTA";

type WikiDonationCTAClientProps = {
  browserLanguage?: string;
};

export function WikiDonationCTAClient({ browserLanguage = "en" }: WikiDonationCTAClientProps) {
  return <WikiDonationCTA browserLanguage={browserLanguage} />;
}

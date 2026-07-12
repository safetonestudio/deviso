import type { Metadata } from "next";

// Les liens de partage de devis ne doivent pas être indexés par Google
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PublicProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

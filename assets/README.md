# Assets embarqués dans les PDF Factur-X

Ces fichiers sont incorporés dans chaque facture générée, ce qu'exige la norme
PDF/A-3 (archivage long terme) : le document doit être autonome, sans dépendre
de polices ou de profils colorimétriques présents sur la machine du lecteur.

## fonts/LiberationSans-{Regular,Bold}.ttf
Police métriquement compatible avec Helvetica/Arial — le rendu des factures est
donc inchangé par rapport aux polices standard utilisées auparavant.
Licence : SIL Open Font License 1.1 (redistribution et incorporation autorisées).
Voir LICENSE-LiberationSans.txt.

## color/sRGB-IEC61966-2.1.icc
Profil colorimétrique sRGB de référence, requis comme OutputIntent PDF/A.
Version ICC 2.2 (PDF/A-3 s'appuie sur PDF 1.7, qui n'accepte pas ICC v4.3+).
Créé par Graeme W. Gill, **placé dans le domaine public**.

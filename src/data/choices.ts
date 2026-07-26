import type { BlockId, ChoiceCard } from '../game/types'

/**
 * Les cartes de choix : le vrai moment pedagogique du jeu.
 *
 * Quand un bloc vient d'etre complete sur le plateau, on interrompt le joueur
 * au sommet de sa recompense et on lui demande de choisir une formulation.
 * Le texte choisi entre reellement dans le prompt final, ce qui rend le choix
 * consequent plutot que decoratif.
 *
 * Regle de redaction des trois options :
 * - `excellent` : precis, situe, et contraignant pour l'IA.
 * - `moyen` : l'intention est bonne mais rien n'est cadre.
 * - `faible` : une erreur classique, pas une betise evidente. Le joueur doit
 *   pouvoir se tromper de bonne foi, sinon il n'apprend rien.
 */
export const CHOICE_CARDS: ChoiceCard[] = [
  // ---------------------------------------------------------- Niveau 1 -----
  {
    levelId: 1,
    block: 'role',
    question: 'Qui doit écrire ce mail ?',
    options: [
      {
        text: "Tu es un commercial expérimenté, habitué aux cycles de vente longs. Ton ton est direct et chaleureux, jamais insistant.",
        quality: 'excellent',
        feedback: "Un métier, une expérience, un ton. L'IA sait exactement dans quel registre écrire.",
      },
      {
        text: 'Tu es un commercial.',
        quality: 'moyen',
        feedback: "Le métier est là, mais rien sur l'expertise ni le ton. L'IA choisira le registre au hasard.",
      },
      {
        text: 'Sois professionnel et efficace.',
        quality: 'faible',
        feedback: "« Professionnel » ne définit rien. C'est le mot que tout le monde écrit quand il n'a pas réfléchi au rôle.",
      },
    ],
  },
  {
    levelId: 1,
    block: 'contexte',
    question: "Que doit savoir l'IA de la situation ?",
    options: [
      {
        text: "Devis de 4 200 € envoyé il y a 14 jours à un client déjà accompagné l'an dernier. Aucune réponse depuis. Il m'avait dit vouloir décider avant la fin du mois.",
        quality: 'excellent',
        feedback: "Montant, délai, historique, échéance. Rien n'est laissé à l'invention.",
      },
      {
        text: "J'ai envoyé un devis il y a deux semaines et le client n'a pas répondu.",
        quality: 'moyen',
        feedback: "Correct mais maigre. L'historique et l'échéance changeraient pourtant le ton du mail.",
      },
      {
        text: 'Le client ne répond pas.',
        quality: 'faible',
        feedback: "Trois mots pour une situation entière. Tout ce que tu ne dis pas, l'IA va l'inventer.",
      },
    ],
  },
  {
    levelId: 1,
    block: 'demande',
    question: 'Quel résultat vises-tu vraiment ?',
    options: [
      {
        text: "Rédige un mail de relance qui obtienne une réponse, même négative, en laissant au client une porte de sortie facile.",
        quality: 'excellent',
        feedback: "Un objectif mesurable — obtenir une réponse — et une contrainte qui oriente tout le texte.",
      },
      {
        text: 'Écris un mail de relance.',
        quality: 'moyen',
        feedback: "L'action est claire, le résultat attendu ne l'est pas. Relancer pour obtenir quoi ?",
      },
      {
        text: 'Parle-moi de la relance client.',
        quality: 'faible',
        feedback: "C'est un sujet, pas une demande. Tu vas recevoir un cours, pas ton mail.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 2 -----
  {
    levelId: 2,
    block: 'role',
    question: 'Quel regard doit porter sur cette réunion ?',
    options: [
      {
        text: "Tu es un chef de projet qui rédige des comptes-rendus lus par des gens pressés. Tu vas à l'essentiel et tu ne rapportes que ce qui engage quelqu'un.",
        quality: 'excellent',
        feedback: "Le rôle porte un critère de tri : « ce qui engage quelqu'un ». C'est lui qui fera le travail.",
      },
      {
        text: 'Tu es un secrétaire de séance rigoureux et exhaustif.',
        quality: 'moyen',
        feedback: "Rigoureux, oui. Mais « exhaustif » va produire les dix pages que personne ne lira.",
      },
      {
        text: 'Tu es un expert en communication.',
        quality: 'faible',
        feedback: "« Expert en » suivi d'un mot vague est le rôle le plus courant et le moins utile.",
      },
    ],
  },
  {
    levelId: 2,
    block: 'contexte',
    question: 'Que faut-il savoir de cette réunion ?',
    options: [
      {
        text: "Réunion d'une heure entre 5 personnes de 3 services, sur le lancement d'un nouveau service en septembre. Deux points sont restés en désaccord. Le compte-rendu sera lu par la direction, qui n'était pas présente.",
        quality: 'excellent',
        feedback: "Le point décisif est le dernier : le lecteur n'était pas là. Tout le compte-rendu en découle.",
      },
      {
        text: "Réunion d'une heure sur le lancement d'un nouveau service, avec plusieurs services représentés.",
        quality: 'moyen',
        feedback: "Le sujet est posé, mais on ignore qui lira. Or c'est le lecteur qui dicte le niveau de détail.",
      },
      {
        text: "C'était une réunion importante avec beaucoup d'informations.",
        quality: 'faible',
        feedback: "« Importante » et « beaucoup » ne sont pas des informations. Ce sont des impressions.",
      },
    ],
  },
  {
    levelId: 2,
    block: 'demande',
    question: 'Que doit produire ce prompt ?',
    options: [
      {
        text: "Produis un compte-rendu que la direction puisse lire en deux minutes et qui lui permette de trancher les deux désaccords sans avoir à me rappeler.",
        quality: 'excellent',
        feedback: "Un temps de lecture, un lecteur, une décision à permettre. Le résultat est vérifiable.",
      },
      {
        text: 'Fais un compte-rendu clair et synthétique de cette réunion.',
        quality: 'moyen',
        feedback: "« Clair » et « synthétique » sont des vœux. Deux minutes de lecture, ça se vérifie.",
      },
      {
        text: 'Résume tout ce qui a été dit.',
        quality: 'faible',
        feedback: "« Tout » est l'inverse d'un compte-rendu. Tu redemandes la réunion en version écrite.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 3 -----
  {
    levelId: 3,
    block: 'role',
    question: 'Qui rédige cette annonce ?',
    options: [
      {
        text: "Tu es un vendeur particulier honnête, qui sait que les annonces qui mentionnent les défauts se vendent plus vite que celles qui les cachent. Ton ton est simple et factuel.",
        quality: 'excellent',
        feedback: "Le rôle contient une conviction — mentionner les défauts — qui va orienter tout le texte.",
      },
      {
        text: 'Tu es un rédacteur qui écrit des annonces de vente.',
        quality: 'moyen',
        feedback: "Fonctionnel, mais neutre. Aucun angle, donc une annonce qui ressemblera à toutes les autres.",
      },
      {
        text: 'Tu es un expert du marketing, sois persuasif et vendeur.',
        quality: 'faible',
        feedback: "« Persuasif » sur une annonce entre particuliers produit du survendu, et le survendu inquiète.",
      },
    ],
  },
  {
    levelId: 3,
    block: 'contexte',
    question: 'Que doit savoir ton IA sur cet objet ?',
    options: [
      {
        text: "Vélo de ville acheté 600 € il y a 3 ans, environ 2 000 km, révisé en mars. Une rayure sur le cadre et les freins à changer bientôt. Je le vends 250 € parce que je déménage et je veux que ce soit fait en deux semaines.",
        quality: 'excellent',
        feedback: "Prix, usage, défauts, motif, délai. L'acheteur n'a plus de question à poser — c'était l'objectif.",
      },
      {
        text: "Je vends mon vélo de ville, il a 3 ans et il est en bon état. Prix : 250 €.",
        quality: 'moyen',
        feedback: "« Bon état » est exactement ce que l'acheteur va vouloir vérifier. Tu récolteras les questions.",
      },
      {
        text: 'Je vends un vélo en bon état, pas cher.',
        quality: 'faible',
        feedback: "Sans prix ni détail, l'IA va inventer les caractéristiques. Et tu publieras ses inventions.",
      },
    ],
  },
  {
    levelId: 3,
    block: 'demande',
    question: 'Quel est le but de cette annonce ?',
    options: [
      {
        text: "Rédige une annonce qui inspire assez confiance pour déclencher un message direct, et qui coupe court aux questions habituelles sur l'état et la raison de la vente.",
        quality: 'excellent',
        feedback: "Deux objectifs concrets : déclencher un contact, et éliminer les questions. Ça se mesure.",
      },
      {
        text: 'Écris une annonce attractive pour vendre ce vélo.',
        quality: 'moyen',
        feedback: "« Attractive » ne dit pas ce qui doit se passer. Un contact ? Un prix tenu ? Une vente rapide ?",
      },
      {
        text: 'Fais quelque chose de sympa pour mon annonce.',
        quality: 'faible',
        feedback: "Aucune cible, aucun résultat. Tu jugeras la réponse à l'humeur, faute de critère.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 4 -----
  {
    levelId: 4,
    block: 'role',
    question: 'Qui doit répondre à cet avis ?',
    options: [
      {
        text: "Tu es un responsable de la relation client, habitué aux avis publics. Tu sais que ta réponse s'adresse aux futurs lecteurs autant qu'au client mécontent. Ton ton reste calme, jamais défensif.",
        quality: 'excellent',
        feedback: "Le rôle intègre la vraie cible — les futurs lecteurs — et interdit le réflexe défensif.",
      },
      {
        text: 'Tu es un responsable du service client courtois et à l\'écoute.',
        quality: 'moyen',
        feedback: "Courtois, mais pour qui ? Sans la notion de public, la réponse s'adressera au seul plaignant.",
      },
      {
        text: "Tu es un avocat, défends l'entreprise contre cet avis injuste.",
        quality: 'faible',
        feedback: "Le registre de la défense est un piège classique : il donne raison au plaignant aux yeux des lecteurs.",
      },
    ],
  },
  {
    levelId: 4,
    block: 'contexte',
    question: 'Quel est le cadre exact ?',
    options: [
      {
        text: "Avis public en 1 étoile : livraison reçue avec 6 jours de retard, sans information de notre part. Le reproche est fondé, le retard vient de nous. L'avis est visible en tête de notre page, lue par tous nos prospects.",
        quality: 'excellent',
        feedback: "Reconnaître que le reproche est fondé change tout le prompt. Cacher ce fait produirait une réponse à côté.",
      },
      {
        text: "Un client a laissé un avis en 1 étoile parce que sa livraison est arrivée en retard.",
        quality: 'moyen',
        feedback: "Le fait est là, la responsabilité non. L'IA ne sait pas si elle doit s'excuser ou se justifier.",
      },
      {
        text: 'Un client est mécontent et il exagère beaucoup.',
        quality: 'faible',
        feedback: "Un jugement à la place des faits. L'IA va construire sa réponse sur ton agacement.",
      },
    ],
  },
  {
    levelId: 4,
    block: 'demande',
    question: 'Que doit accomplir cette réponse ?',
    options: [
      {
        text: "Rédige une réponse publique qui reconnaisse le tort sans formule creuse, propose une réparation concrète, et laisse aux futurs lecteurs l'impression d'une entreprise qui assume.",
        quality: 'excellent',
        feedback: "Trois résultats attendus, dont le plus important : l'effet sur ceux qui liront ensuite.",
      },
      {
        text: "Écris une réponse polie pour calmer ce client.",
        quality: 'moyen',
        feedback: "Calmer le client est une demi-cible. La réponse est publique : elle joue surtout pour les autres.",
      },
      {
        text: 'Réponds à cet avis négatif.',
        quality: 'faible',
        feedback: "Répondre n'est pas un objectif. Tu obtiendras la formule générique que tout le monde publie.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 5 -----
  {
    levelId: 5,
    block: 'role',
    question: 'Qui va te faire comprendre ce sujet ?',
    options: [
      {
        text: "Tu es un formateur qui explique des sujets techniques à des non-spécialistes. Tu pars toujours de ce que la personne connaît déjà, et tu refuses le jargon non expliqué.",
        quality: 'excellent',
        feedback: "« Partir de ce que la personne connaît » est une méthode, pas un adjectif. Elle change la réponse.",
      },
      {
        text: 'Tu es un expert reconnu du domaine, très pédagogue.',
        quality: 'moyen',
        feedback: "« Pédagogue » est une intention. Rien ne dit comment expliquer, ni à quel niveau viser.",
      },
      {
        text: "Tu es la meilleure IA du monde, tu sais tout sur tout.",
        quality: 'faible',
        feedback: "Flatter le modèle ne change rien à sa réponse. Ces mots occupent la place d'un vrai rôle.",
      },
    ],
  },
  {
    levelId: 5,
    block: 'contexte',
    question: "D'où pars-tu ?",
    options: [
      {
        text: "Je dois animer demain une réunion de 30 minutes sur ce sujet, devant des collègues qui n'y connaissent rien. Moi-même je n'en ai qu'une vague idée. On me posera sûrement des questions sur le coût et les risques.",
        quality: 'excellent',
        feedback: "Ton niveau, le public, la durée, et les questions redoutées. La fiche s'écrit presque toute seule.",
      },
      {
        text: "Je dois présenter ce sujet demain à des collègues et je le connais mal.",
        quality: 'moyen',
        feedback: "Bon début. Mais sans la durée ni les questions attendues, tu recevras une fiche hors format.",
      },
      {
        text: 'Je veux comprendre ce sujet rapidement.',
        quality: 'faible',
        feedback: "« Rapidement » ne dit ni ton niveau de départ, ni jusqu'où tu dois aller. Deux inconnues sur trois.",
      },
    ],
  },
  {
    levelId: 5,
    block: 'demande',
    question: 'Quelle est la vraie demande ?',
    options: [
      {
        text: "Produis une fiche qui me permette de tenir 30 minutes debout devant des collègues et de répondre sans hésiter aux questions sur le coût et les risques.",
        quality: 'excellent',
        feedback: "Le critère de réussite est comportemental : tenir debout, répondre sans hésiter. Impossible à rater à moitié.",
      },
      {
        text: 'Fais-moi une fiche de synthèse claire sur ce sujet.',
        quality: 'moyen',
        feedback: "Une fiche pour quoi faire ? Réviser, présenter et décider ne produisent pas la même fiche.",
      },
      {
        text: 'Explique-moi ce sujet en détail.',
        quality: 'faible',
        feedback: "« En détail » va te noyer. Tu voulais tenir 30 minutes, pas lire un manuel.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 6 -----
  {
    levelId: 6,
    block: 'role',
    question: 'Qui organise ce week-end ?',
    options: [
      {
        text: "Tu es un organisateur de voyages qui travaille avec de petits budgets. Tu proposes toujours des options réalistes, avec les temps de trajet réels, et tu signales ce qui doit être réservé à l'avance.",
        quality: 'excellent',
        feedback: "« Temps de trajet réels » et « à réserver à l'avance » sont des garde-fous contre le programme impossible.",
      },
      {
        text: "Tu es un agent de voyage qui propose des séjours sur mesure.",
        quality: 'moyen',
        feedback: "Sur mesure de quoi ? Sans contrainte de budget ni de réalisme, tu auras un programme de brochure.",
      },
      {
        text: 'Sois créatif et surprends-moi.',
        quality: 'faible',
        feedback: "« Surprends-moi » sur un week-end à budget serré est le meilleur moyen d'obtenir l'inutilisable.",
      },
    ],
  },
  {
    levelId: 6,
    block: 'contexte',
    question: 'Quelles sont les contraintes ?',
    options: [
      {
        text: "Trois personnes, départ de Lyon le vendredi soir, retour dimanche 18 h. 400 € au total tout compris, sans voiture. L'un veut de la randonnée, l'autre des musées, la troisième veut surtout dormir.",
        quality: 'excellent',
        feedback: "Le budget, la mobilité, et surtout les envies contradictoires : c'est le vrai problème à résoudre.",
      },
      {
        text: 'Trois personnes, un week-end, petit budget, on part de Lyon.',
        quality: 'moyen',
        feedback: "« Petit budget » n'est pas un chiffre. Et le désaccord entre vous trois n'apparaît nulle part.",
      },
      {
        text: 'On veut partir en week-end tous les trois.',
        quality: 'faible',
        feedback: "Ni lieu, ni budget, ni date. L'IA va inventer les trois, et son programme sera hors sujet.",
      },
    ],
  },
  {
    levelId: 6,
    block: 'demande',
    question: "Qu'attends-tu au bout ?",
    options: [
      {
        text: "Propose deux programmes concurrents tenant dans 400 €, chacun assumant un compromis différent entre randonnée, musées et repos, pour qu'on puisse trancher à trois en dix minutes.",
        quality: 'excellent',
        feedback: "Demander deux options concurrentes transforme un choix impossible en décision rapide.",
      },
      {
        text: 'Propose-moi un programme de week-end adapté à nos envies.',
        quality: 'moyen',
        feedback: "Une seule proposition sur des envies contradictoires : elle mécontentera forcément quelqu'un.",
      },
      {
        text: 'Donne-moi des idées de week-end.',
        quality: 'faible',
        feedback: "« Des idées » produit une liste vague que vous ne saurez pas départager. Retour à la case départ.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 7 -----
  {
    levelId: 7,
    block: 'role',
    question: 'Qui va comparer ces offres ?',
    options: [
      {
        text: "Tu es un analyste habitué à comparer des offres commerciales. Tu débusques les coûts cachés et les clauses d'engagement, et tu ne te laisses pas impressionner par les arguments marketing.",
        quality: 'excellent',
        feedback: "« Coûts cachés » et « clauses d'engagement » disent à l'IA où regarder. C'est ça, un rôle utile.",
      },
      {
        text: "Tu es un consultant qui aide à choisir entre plusieurs offres.",
        quality: 'moyen',
        feedback: "Correct, mais sans méfiance particulière. L'IA comparera les arguments des vendeurs entre eux.",
      },
      {
        text: 'Tu es objectif et neutre.',
        quality: 'faible',
        feedback: "Se déclarer neutre n'apporte aucune compétence. C'est une posture, pas une expertise.",
      },
    ],
  },
  {
    levelId: 7,
    block: 'contexte',
    question: 'Quel est le cadre de la décision ?',
    options: [
      {
        text: "Trois offres d'abonnement pour une équipe de 8 personnes, entre 40 et 75 € par mois. Budget annuel plafonné à 6 000 €. On change d'outil parce que l'actuel ne gère pas le travail à plusieurs. Décision à prendre aujourd'hui.",
        quality: 'excellent',
        feedback: "Le motif du changement est le critère décisif. Sans lui, la comparaison porterait sur le prix seul.",
      },
      {
        text: "Trois offres d'abonnement pour une équipe de 8 personnes, budget limité.",
        quality: 'moyen',
        feedback: "On connaît la taille et la contrainte, mais pas pourquoi tu changes. Le classement en dépend pourtant.",
      },
      {
        text: 'Trois offres, il faut choisir la meilleure.',
        quality: 'faible',
        feedback: "« La meilleure » selon quoi ? Sans critère, l'IA appliquera les siens, et tu ne sauras pas lesquels.",
      },
    ],
  },
  {
    levelId: 7,
    block: 'demande',
    question: 'Que doit permettre ce comparatif ?',
    options: [
      {
        text: "Permets-moi de trancher aujourd'hui en connaissance de cause, en identifiant l'offre la plus adaptée au travail à plusieurs et le risque principal de chacune.",
        quality: 'excellent',
        feedback: "Trancher aujourd'hui, sur un critère nommé, avec les risques. La réponse sera directement actionnable.",
      },
      {
        text: 'Compare ces trois offres et dis-moi laquelle choisir.',
        quality: 'moyen',
        feedback: "L'IA choisira, mais sur ses propres critères. Tu devras la croire sur parole.",
      },
      {
        text: 'Analyse ces trois offres.',
        quality: 'faible',
        feedback: "« Analyse » sans finalité produit une description des trois offres. Tu seras aussi indécis qu'avant.",
      },
    ],
  },
  {
    levelId: 7,
    block: 'taches',
    question: 'Comment découper le travail ?',
    options: [
      {
        text: "1. Extrais le coût réel sur 12 mois de chaque offre, frais d'activation inclus.\n2. Note chaque offre sur le travail à plusieurs.\n3. Relève pour chacune la clause la plus contraignante.\n4. Classe les trois offres.\n5. Termine par ta recommandation en deux phrases.",
        quality: 'excellent',
        feedback: "Cinq étapes numérotées, chacune avec un livrable. L'IA ne peut pas sauter le milieu du raisonnement.",
      },
      {
        text: "Analyse les prix, puis les fonctionnalités, puis fais une recommandation.",
        quality: 'moyen',
        feedback: "L'ordre est bon, mais chaque étape reste floue. « Analyse les prix » : lesquels, sur quelle durée ?",
      },
      {
        text: 'Regarde tous les aspects importants et fais le tri.',
        quality: 'faible',
        feedback: "Aucune étape. C'est la demande reformulée, pas un découpage — et le milieu sera bâclé.",
      },
    ],
  },
  {
    levelId: 7,
    block: 'format',
    question: 'Sous quelle forme veux-tu la réponse ?',
    options: [
      {
        text: "Un tableau comparatif : une ligne par offre, colonnes « coût réel 12 mois », « travail à plusieurs (note /5) », « clause à risque ». Puis, sous le tableau, ta recommandation en deux phrases maximum.",
        quality: 'excellent',
        feedback: "Les colonnes sont nommées. Tu obtiendras exactement le tableau que tu as en tête, du premier coup.",
      },
      {
        text: "Présente le résultat sous forme de tableau, suivi d'une conclusion.",
        quality: 'moyen',
        feedback: "Un tableau, oui — mais avec quelles colonnes ? L'IA choisira, et rarement les tiennes.",
      },
      {
        text: 'Réponds de manière claire et bien organisée.',
        quality: 'faible',
        feedback: "« Bien organisé » est le format par défaut de l'IA : un pavé à puces que tu remettras en forme.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 8 -----
  {
    levelId: 8,
    block: 'role',
    question: 'Qui construit ce plan ?',
    options: [
      {
        text: "Tu es un rédacteur en chef qui bâtit des plans avant d'écrire. Tu élimines sans pitié les parties qui font doublon et tu vérifies que chaque section apporte une idée que la précédente n'a pas déjà donnée.",
        quality: 'excellent',
        feedback: "Un critère de coupe explicite. C'est ce qui évite le plan en huit parties dont trois se répètent.",
      },
      {
        text: "Tu es un rédacteur web expérimenté qui structure des articles.",
        quality: 'moyen',
        feedback: "L'expérience est affirmée, pas outillée. Rien n'empêchera les redites entre sections.",
      },
      {
        text: 'Tu écris très bien et tu connais le SEO.',
        quality: 'faible',
        feedback: "Empiler des qualités n'est pas définir un rôle. Et « connaître le SEO » n'aide en rien à structurer.",
      },
    ],
  },
  {
    levelId: 8,
    block: 'contexte',
    question: 'Dans quel cadre écris-tu ?',
    options: [
      {
        text: "Article de 1 500 mots pour un blog professionnel, lu par des gens qui connaissent le sujet de loin mais doivent décider s'ils s'y mettent. Trois articles concurrents traitent déjà les bases : je dois apporter autre chose.",
        quality: 'excellent',
        feedback: "La dernière phrase est décisive : elle interdit à l'IA de te proposer le plan que tout le monde a déjà écrit.",
      },
      {
        text: 'Article de 1 500 mots pour un blog professionnel, sur un sujet technique.',
        quality: 'moyen',
        feedback: "Le format est cadré, le lecteur non. Or « décider s'il s'y met » et « apprendre » donnent deux plans opposés.",
      },
      {
        text: "C'est pour un article de blog.",
        quality: 'faible',
        feedback: "Ni longueur, ni lecteur, ni angle. Trois inconnues que l'IA comblera par les valeurs les plus banales.",
      },
    ],
  },
  {
    levelId: 8,
    block: 'demande',
    question: 'Que doit produire ce plan ?',
    options: [
      {
        text: "Produis un plan qui me permette d'écrire l'article d'une traite, sans me demander à mi-parcours ce que je voulais dire dans la partie 3.",
        quality: 'excellent',
        feedback: "Un critère de réussite très concret : le plan doit tenir à l'écriture. C'est vérifiable.",
      },
      {
        text: "Propose un plan détaillé et structuré pour cet article.",
        quality: 'moyen',
        feedback: "« Détaillé » et « structuré » décrivent un plan, pas ce qu'il doit te permettre de faire.",
      },
      {
        text: 'Fais-moi un plan.',
        quality: 'faible',
        feedback: "Tu obtiendras le plan générique introduction / trois parties / conclusion. Celui que tu aurais trouvé seul.",
      },
    ],
  },
  {
    levelId: 8,
    block: 'taches',
    question: 'Quelles étapes suivre ?',
    options: [
      {
        text: "1. Formule en une phrase la promesse de l'article.\n2. Liste ce que les trois articles concurrents traitent déjà, pour l'éviter.\n3. Propose 4 à 5 sections, chacune avec son idée unique en une ligne.\n4. Indique pour chaque section son intérêt pour le lecteur.\n5. Signale les sections qui pourraient être fusionnées.",
        quality: 'excellent',
        feedback: "L'étape 2 force l'IA à écarter le déjà-vu avant de proposer. L'ordre des tâches fait le travail.",
      },
      {
        text: "Trouve l'angle, propose les sections, puis vérifie la cohérence de l'ensemble.",
        quality: 'moyen',
        feedback: "Trois étapes correctes, mais aucune n'est outillée. « Vérifie la cohérence » sur quelle base ?",
      },
      {
        text: "Réfléchis bien avant de proposer le plan.",
        quality: 'faible',
        feedback: "« Réfléchis bien » n'est pas une tâche. Il n'y a rien à exécuter là-dedans.",
      },
    ],
  },
  {
    levelId: 8,
    block: 'format',
    question: 'Quelle forme doit prendre le plan ?',
    options: [
      {
        text: "Une liste numérotée de sections. Pour chacune : le titre, l'idée unique en une ligne, et le nombre de mots visé. Total affiché en bas. Pas de paragraphe rédigé.",
        quality: 'excellent',
        feedback: "« Pas de paragraphe rédigé » vaut de l'or : sans cette interdiction, l'IA commence à écrire l'article.",
      },
      {
        text: 'Présente le plan sous forme de liste hiérarchisée avec des titres.',
        quality: 'moyen',
        feedback: "La forme est là, le contenu de chaque ligne non. Et rien n'empêche l'IA de rédiger au passage.",
      },
      {
        text: 'Format libre, du moment que c\'est lisible.',
        quality: 'faible',
        feedback: "Laisser le format libre, c'est accepter de remettre en forme toi-même. Tu as fait le travail deux fois.",
      },
    ],
  },

  // ---------------------------------------------------------- Niveau 9 -----
  {
    levelId: 9,
    block: 'role',
    question: 'Qui construit ce planning ?',
    options: [
      {
        text: "Tu es un coach en organisation qui sait que les plannings trop pleins sont abandonnés dès le mardi. Tu prévois systématiquement du temps tampon et tu refuses de remplir plus de 70 % des heures disponibles.",
        quality: 'excellent',
        feedback: "Une règle chiffrée — 70 % — dans le rôle. C'est elle qui rendra le planning survivable.",
      },
      {
        text: "Tu es un expert en gestion du temps et en productivité.",
        quality: 'moyen',
        feedback: "L'expertise est là mais sans garde-fou. Beaucoup de méthodes de productivité remplissent tout.",
      },
      {
        text: 'Aide-moi à mieux m\'organiser.',
        quality: 'faible',
        feedback: "C'est une demande déguisée en rôle. La case Rôle reste vide, et l'IA prend le ton qu'elle veut.",
      },
    ],
  },
  {
    levelId: 9,
    block: 'contexte',
    question: 'Quelle est ta semaine réelle ?',
    options: [
      {
        text: "Semaine de 5 jours, 8 h par jour, dont 12 h déjà prises par des réunions fixes. Trois dossiers à avancer, dont un à rendre jeudi. Je suis nettement plus efficace le matin, et le mercredi après-midi saute une fois sur deux.",
        quality: 'excellent',
        feedback: "Les heures déjà prises, l'échéance, le rythme, et l'imprévu récurrent. Le planning collera au réel.",
      },
      {
        text: "Semaine de 5 jours avec plusieurs réunions et trois dossiers à avancer.",
        quality: 'moyen',
        feedback: "« Plusieurs réunions » n'est pas un volume. Sans les heures réellement libres, le planning sera fictif.",
      },
      {
        text: "J'ai beaucoup de choses à faire cette semaine.",
        quality: 'faible',
        feedback: "Rien d'exploitable. L'IA va inventer ta semaine, et tu jetteras son planning.",
      },
    ],
  },
  {
    levelId: 9,
    block: 'demande',
    question: 'Que doit permettre ce planning ?',
    options: [
      {
        text: "Construis un planning qui tienne encore debout mercredi soir, même si l'après-midi saute, et qui garantisse que le dossier de jeudi soit prêt mercredi midi.",
        quality: 'excellent',
        feedback: "Le planning doit résister à un imprévu nommé. C'est un critère de robustesse, pas un vœu.",
      },
      {
        text: "Organise ma semaine de façon efficace et réaliste.",
        quality: 'moyen',
        feedback: "« Réaliste » selon qui ? Sans épreuve à passer, tout planning se déclare réaliste.",
      },
      {
        text: 'Fais-moi un planning de la semaine.',
        quality: 'faible',
        feedback: "Tu recevras une grille pleine du lundi au vendredi. Elle sautera au premier imprévu.",
      },
    ],
  },
  {
    levelId: 9,
    block: 'taches',
    question: 'Dans quel ordre procéder ?',
    options: [
      {
        text: "1. Calcule les heures réellement disponibles après les réunions fixes.\n2. Place d'abord le dossier de jeudi, sur des créneaux du matin.\n3. Répartis les deux autres dossiers sur ce qui reste.\n4. Laisse 30 % du temps non planifié.\n5. Indique quoi décaler en priorité si le mercredi saute.",
        quality: 'excellent',
        feedback: "L'étape 5 prépare l'imprévu au lieu de le subir. C'est ce qui distingue un planning d'une liste de vœux.",
      },
      {
        text: 'Calcule le temps disponible, répartis les dossiers, garde de la marge.',
        quality: 'moyen',
        feedback: "Les trois étapes sont justes, mais aucune priorité n'est donnée. Le dossier de jeudi peut finir vendredi.",
      },
      {
        text: 'Organise tout ça au mieux.',
        quality: 'faible',
        feedback: "Aucun découpage. L'IA improvisera son ordre, et le plus urgent ne passera pas forcément en premier.",
      },
    ],
  },
  {
    levelId: 9,
    block: 'format',
    question: 'Sous quelle forme le veux-tu ?',
    options: [
      {
        text: "Un tableau : une colonne par jour, une ligne par demi-journée. Chaque case contient la tâche et sa durée. Les créneaux tampons apparaissent en clair sous le nom « marge ». Sous le tableau, le plan de repli en trois lignes.",
        quality: 'excellent',
        feedback: "Jusqu'à la façon dont les marges apparaissent. Rien n'est laissé à l'interprétation.",
      },
      {
        text: 'Présente-moi ça sous forme de tableau par jour.',
        quality: 'moyen',
        feedback: "La grille est demandée, sa granularité non. Par heure ou par demi-journée ? Le résultat n'a rien à voir.",
      },
      {
        text: 'Peu importe la forme, tant que je comprends.',
        quality: 'faible',
        feedback: "Un planning est un objet visuel. Renoncer au format, c'est renoncer à la moitié de son utilité.",
      },
    ],
  },

  // --------------------------------------------------------- Niveau 10 -----
  {
    levelId: 10,
    block: 'role',
    question: 'Qui rédige ce dossier ?',
    options: [
      {
        text: "Tu es un rédacteur de notes de synthèse pour des décideurs pressés. Tu places toujours la conclusion en premier, tu distingues clairement les faits établis des hypothèses, et tu signales ce qui manque.",
        quality: 'excellent',
        feedback: "Trois règles de métier explicites. « Signaler ce qui manque » est celle que presque personne ne pense à demander.",
      },
      {
        text: 'Tu es un analyste qui rédige des dossiers de synthèse rigoureux.',
        quality: 'moyen',
        feedback: "« Rigoureux » ne dit pas comment. Rien ne garantit que les hypothèses seront distinguées des faits.",
      },
      {
        text: "Tu es un professionnel sérieux, applique-toi.",
        quality: 'faible',
        feedback: "Demander à l'IA de « s'appliquer » ne produit aucun effet. Seules les consignes concrètes en produisent.",
      },
    ],
  },
  {
    levelId: 10,
    block: 'contexte',
    question: 'Quel est le cadre du dossier ?',
    options: [
      {
        text: "Dossier à rendre lundi matin, lu par trois responsables qui décideront de poursuivre ou d'arrêter le projet. J'ai les chiffres des six derniers mois, mais rien sur la concurrence. Deux des trois lecteurs sont déjà sceptiques.",
        quality: 'excellent',
        feedback: "La lacune assumée et le scepticisme des lecteurs sont les deux informations qui changent tout le dossier.",
      },
      {
        text: "Dossier de synthèse à rendre lundi, avec les chiffres des six derniers mois.",
        quality: 'moyen',
        feedback: "Le délai et la matière sont là. Mais on ignore qui décide quoi, donc à quoi doit servir le dossier.",
      },
      {
        text: "J'ai des données et je dois faire un dossier.",
        quality: 'faible',
        feedback: "Ni lecteur, ni décision, ni périmètre. Le dossier sera une mise en forme, pas une aide à la décision.",
      },
    ],
  },
  {
    levelId: 10,
    block: 'demande',
    question: 'À quoi doit servir ce dossier ?',
    options: [
      {
        text: "Produis un dossier qui permette aux trois responsables de trancher lundi en 15 minutes de lecture, y compris les deux sceptiques, sans que le manque de données sur la concurrence puisse être retourné contre moi.",
        quality: 'excellent',
        feedback: "Anticiper l'objection dans la demande, c'est obtenir un dossier qui la désamorce au lieu de la subir.",
      },
      {
        text: 'Rédige un dossier de synthèse convaincant à partir de ces données.',
        quality: 'moyen',
        feedback: "« Convaincant » pour un lecteur acquis, ou pour un sceptique ? Ce n'est pas le même dossier.",
      },
      {
        text: 'Mets tout ça au propre.',
        quality: 'faible',
        feedback: "Tu demandes de la mise en forme alors que tu as besoin d'un argumentaire. La demande est sous-dimensionnée.",
      },
    ],
  },
  {
    levelId: 10,
    block: 'taches',
    question: 'Quelles étapes pour construire le dossier ?',
    options: [
      {
        text: "1. Dégage des chiffres les trois constats les plus solides.\n2. Formule la recommandation en une phrase.\n3. Construis l'argumentaire qui la soutient, constat par constat.\n4. Anticipe les deux objections les plus probables des sceptiques, et réponds-y.\n5. Signale explicitement la limite liée à l'absence de données concurrence.",
        quality: 'excellent',
        feedback: "La recommandation vient à l'étape 2, avant l'argumentaire. C'est l'ordre qui produit une synthèse et non un rapport.",
      },
      {
        text: "Analyse les données, tire des conclusions, rédige le dossier, relis-le.",
        quality: 'moyen',
        feedback: "L'enchaînement est logique mais mécanique. Rien ne traite les sceptiques ni la donnée manquante.",
      },
      {
        text: 'Traite les données et fais-en un dossier complet.',
        quality: 'faible',
        feedback: "« Complet » est un piège : tu obtiendras du volume, alors qu'on te demande 15 minutes de lecture.",
      },
    ],
  },
  {
    levelId: 10,
    block: 'format',
    question: 'Quelle structure pour le rendu ?',
    options: [
      {
        text: "Une page maximum. Recommandation en tête, en gras. Puis trois constats en puces, un chiffre par puce. Puis un encadré « objections et réponses » sur deux lignes. Enfin une ligne « ce que nous ne savons pas encore ». Pas d'introduction.",
        quality: 'excellent',
        feedback: "« Pas d'introduction » économise le paragraphe de politesse que l'IA place systématiquement en tête.",
      },
      {
        text: 'Structure le dossier avec un résumé, des parties claires et une conclusion.',
        quality: 'moyen',
        feedback: "Une structure classique, mais qui place la conclusion à la fin — l'inverse de ce que lit un décideur pressé.",
      },
      {
        text: 'Fais quelque chose de professionnel et bien présenté.',
        quality: 'faible',
        feedback: "« Bien présenté » ne contraint rien. Tu recevras la mise en page par défaut, longue et introductive.",
      },
    ],
  },
]

const cardIndex = new Map<string, ChoiceCard>(
  CHOICE_CARDS.map((card) => [`${card.levelId}:${card.block}`, card]),
)

export function cardFor(levelId: number, block: BlockId): ChoiceCard | undefined {
  return cardIndex.get(`${levelId}:${block}`)
}

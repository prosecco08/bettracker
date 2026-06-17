export const COMPETITIONS = [
  { value: 'SA', label: 'Serie A' },
  { value: 'PL', label: 'Premier League' },
  { value: 'PD', label: 'La Liga' },
  { value: 'FL1', label: 'Ligue 1' },
  { value: 'BL1', label: 'Bundesliga' },
  { value: 'CL', label: 'Champions League' },
  { value: 'EL', label: 'Europa League' },
  { value: 'ECL', label: 'Conference League' },
  { value: 'WC', label: 'Mondiali' },
  { value: 'EC', label: 'Europei' },
  { value: 'OTHER', label: 'Altro' }
]

export const PREDICTION_GROUPS = {
  'Esito partita': {
    '1X2': ['1', 'X', '2'],
    'Doppia chance': ['1X', '12', 'X2'],
    'Draw no bet': ['1 DNB', '2 DNB'],
    'Risultato esatto': ['Risultato esatto'],
    'Parziale / Finale': ['1/1', '1/X', '1/2', 'X/1', 'X/X', 'X/2', '2/1', '2/X', '2/2']
  },

  'Goal': {
    'Goal / No Goal': ['Goal', 'No Goal'],
    'Over / Under goal': ['Over 0.5', 'Over 1.5', 'Over 2.5', 'Over 3.5', 'Under 0.5', 'Under 1.5', 'Under 2.5', 'Under 3.5'],
    'Multigol': ['Multigol 1-2', 'Multigol 1-3', 'Multigol 1-4', 'Multigol 2-3', 'Multigol 2-4', 'Multigol 2-5', 'Multigol 3-5', 'Multigol 4-6'],
    'Entrambe segnano': ['Sì', 'No'],
    'Casa goal': ['Casa Over 0.5', 'Casa Over 1.5', 'Casa Over 2.5', 'Casa No Goal'],
    'Ospite goal': ['Ospite Over 0.5', 'Ospite Over 1.5', 'Ospite Over 2.5', 'Ospite No Goal']
  },

  'Combo': {
    '1X2 + Goal': ['1 + Goal', '1 + No Goal', 'X + Goal', 'X + No Goal', '2 + Goal', '2 + No Goal'],
    '1X2 + Over': ['1 + Over 1.5', '1 + Over 2.5', 'X + Over 1.5', 'X + Over 2.5', '2 + Over 1.5', '2 + Over 2.5'],
    'Doppia chance + Goal': ['1X + Goal', '1X + No Goal', 'X2 + Goal', 'X2 + No Goal', '12 + Goal', '12 + No Goal'],
    'Doppia chance + Over': ['1X + Over 1.5', '1X + Over 2.5', 'X2 + Over 1.5', 'X2 + Over 2.5']
  },

  'Casa / Ospite': {
    'Casa': ['Casa vince', 'Casa segna', 'Casa Over 0.5', 'Casa Over 1.5', 'Casa vince almeno un tempo'],
    'Ospite': ['Ospite vince', 'Ospite segna', 'Ospite Over 0.5', 'Ospite Over 1.5', 'Ospite vince almeno un tempo'],
    'Squadra con più goal': ['Casa più goal', 'Ospite più goal', 'Pari goal']
  },

  'Corner': {
    '1X2 corner': ['1 corner', 'X corner', '2 corner'],
    'U/O corner': ['Over 6.5 corner', 'Over 7.5 corner', 'Over 8.5 corner', 'Over 9.5 corner', 'Under 6.5 corner', 'Under 7.5 corner', 'Under 8.5 corner', 'Under 9.5 corner'],
    '1X2 handicap corner': ['1 handicap corner', 'X handicap corner', '2 handicap corner'],
    'U/O corner squadra casa': ['Casa Over 2.5 corner', 'Casa Over 3.5 corner', 'Casa Over 4.5 corner', 'Casa Under 3.5 corner', 'Casa Under 4.5 corner'],
    'U/O corner squadra ospite': ['Ospite Over 2.5 corner', 'Ospite Over 3.5 corner', 'Ospite Over 4.5 corner', 'Ospite Under 3.5 corner', 'Ospite Under 4.5 corner'],
    'Prima a X corner': [
      'Prima a 2 corner - Team 1',
      'Prima a 2 corner - Nessuno',
      'Prima a 2 corner - Team 2',
      'Prima a 3 corner - Team 1',
      'Prima a 3 corner - Nessuno',
      'Prima a 3 corner - Team 2',
      'Prima a 4 corner - Team 1',
      'Prima a 4 corner - Nessuno',
      'Prima a 4 corner - Team 2',
      'Prima a 5 corner - Team 1',
      'Prima a 5 corner - Nessuno',
      'Prima a 5 corner - Team 2',
      'Prima a 6 corner - Team 1',
      'Prima a 6 corner - Nessuno',
      'Prima a 6 corner - Team 2',
      'Prima a 7 corner - Team 1',
      'Prima a 7 corner - Nessuno',
      'Prima a 7 corner - Team 2',
      'Prima a 8 corner - Team 1',
      'Prima a 8 corner - Nessuno',
      'Prima a 8 corner - Team 2',
      'Prima a 9 corner - Team 1',
      'Prima a 9 corner - Nessuno',
      'Prima a 9 corner - Team 2',
      'Prima a 10 corner - Team 1',
      'Prima a 10 corner - Nessuno',
      'Prima a 10 corner - Team 2'
    ],
    'Totale corner': ['Meno di 6 corner', 'Da 6 a 8 corner', 'Da 9 a 11 corner', 'Da 12 a 14 corner', 'Più di 14 corner'],
    '1 tempo corner': ['1T 1 corner', '1T X corner', '1T 2 corner', '1T Over 3.5 corner', '1T Under 3.5 corner', '1T Over 4.5 corner', '1T Under 4.5 corner'],
    'Corner entrambi i tempi': ['Almeno 3 corner in entrambi i tempi', 'Almeno 4 corner in entrambi i tempi', 'Almeno 5 corner in entrambi i tempi', 'Entrambe almeno 2 corner', 'Entrambe almeno 3 corner']
  },

  'Cartellini': {
    'U/O cartellini': ['Over 2.5 cartellini', 'Over 3.5 cartellini', 'Over 4.5 cartellini', 'Under 2.5 cartellini', 'Under 3.5 cartellini', 'Under 4.5 cartellini'],
    'Cartellini squadra': ['Casa Over 1.5 cartellini', 'Ospite Over 1.5 cartellini', 'Casa più cartellini', 'Ospite più cartellini'],
    'Rosso': ['Cartellino rosso sì', 'Cartellino rosso no']
  },

  'Tempi': {
    '1 tempo': ['1T 1', '1T X', '1T 2', '1T Goal', '1T No Goal', '1T Over 0.5', '1T Over 1.5'],
    '2 tempo': ['2T 1', '2T X', '2T 2', '2T Goal', '2T No Goal', '2T Over 0.5', '2T Over 1.5'],
    'Goal nei tempi': ['Goal in entrambi i tempi', 'No goal in entrambi i tempi', 'Casa segna entrambi i tempi', 'Ospite segna entrambi i tempi']
  },

  'Marcatori': {
    'Marcatore': ['Marcatore anytime', 'Primo marcatore', 'Ultimo marcatore'],
    'Assist': ['Assist sì'],
    'Tiri': ['Giocatore 1+ tiro', 'Giocatore 2+ tiri', 'Giocatore tiro in porta']
  },

  'Speciali': {
    'Altro': ['Fissa', 'Sistema', 'Risultato esatto', 'Marcatore personalizzato', 'Altro']
  }
}
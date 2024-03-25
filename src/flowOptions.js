const MAIN_OPTIONS = {
  'font-size': 12,
  'line-length': 10,
  'text-margin': 7,
  flowstate: {
    selected: {
      'font-weight': 'bold',
      'font-size': 16,
      fill: 'green'
    },
    nopNoModal: {
      fill: 'black'
    },
    nop: {
      fill: '#303030'
    }
  }
}

const MEMORY_STATES_OPTIONS = {
  'font-size': 12,
  'line-length': 5,
  scale: 0.8,
  flowstate: {
    selected: {
      fill: 'green'
    },
    nopNoModal: {
      fill: 'black'
    },
    nop: {
      fill: '#303030'
    }
  }
}

module.exports = {
  main: MAIN_OPTIONS,
  memoryStates: MEMORY_STATES_OPTIONS
}

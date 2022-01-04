export default {
  'debug': false,
  'map': {

    /**
     * Player movement can wrap/pass through map bounds.
     */
    'wrap': false,

    /**
     * Player movement snaps to grid.
     *
     * false || integer. Should mirror main:background-image size.
     *
     * The actions.Shift* fast mode is disabled if snapTo is enabled.
     */
    'snapTo': false

  },
  'actions': {
    'ArrowLeft': 'move',
    'ArrowRight': 'move',
    'ArrowUp': 'move',
    'ArrowDown': 'move',
    'Shift': 'fast'
  },
  'header': {
    'title': 'Game'
  }
}

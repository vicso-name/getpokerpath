/** Point on the table as percentages of its width and height. */
export interface TablePoint {
  left: number;
  top: number;
}

export const SEAT_RADIUS = 43;
export const DEALER_CHIP_RADIUS = 27;

/**
 * Places a seat on an ellipse. Seat 0 is bottom center and numbers rise clockwise
 * as seen on screen, matching how action and the dealer button move. On a y-down
 * screen, a growing angle turns clockwise.
 */
export function seatPoint(seat: number, seats: number, radius: number = SEAT_RADIUS): TablePoint {
  const angle = Math.PI / 2 + (seat / seats) * 2 * Math.PI;
  return {
    left: Math.round((50 + radius * Math.cos(angle)) * 100) / 100,
    top: Math.round((50 + radius * Math.sin(angle)) * 100) / 100,
  };
}

import { Container, Text } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import type { Village } from '../mapZone/village';

export class MapRenderer {

  renderWardNames(village: Village) {
    const text = new Container;
    village.wards.forEach((ward) => {
      const tx = new Text(ward.name, { fontSize: 9, fontWeight: "800", fill: "0x1a1d24" });
      tx.x = ward.centroid[0] - (tx.width/2);
      tx.y = ward.centroid[1] - 15;
      text.addChild(tx);
    });

    return text;
  }

  drawVillage(graphics: Graphics, village: Village, bounds: Array<Array<number>>, villageDimensions: { width: number, height: number }) {
    graphics.lineStyle(3, 0x777777);
    graphics.beginFill(0x785534);
    graphics.drawRoundedRect(bounds[0][0], bounds[0][1], villageDimensions.width, villageDimensions.height, 40);
    graphics.endFill();
  
    // Draw the ward streets
    graphics.lineStyle(1, 0x303742, 0.2);
    village.wards.forEach(ward => ward.streets.forEach((street) => {
      const nodeA = street[0];
      const nodeB = street[1];
      graphics.moveTo(nodeA[0], nodeA[1]);
      graphics.lineTo(nodeB[0], nodeB[1]);
    }));
    // Draw the main streets
    graphics.lineStyle(8, 0x303742);
    village.streets.forEach((street) => {
      const nodeA = street[0];
      const nodeB = street[1];
      graphics.moveTo(nodeA[0], nodeA[1]);
      graphics.lineTo(nodeB[0], nodeB[1]);
    });
  
    graphics.lineStyle(2, 0x303742);
    village.mesh.edges(true).forEach((edge) => {
      graphics.moveTo(edge[0][0], edge[0][1]);
      graphics.lineTo(edge[1][0], edge[1][1]);
      //console.log(edge);
    });
  
    village.intersections.forEach((point, i) => {
      graphics.lineStyle(1, 0x384252);
      graphics.beginFill(0x21262e);
      graphics.drawCircle(point[0], point[1], 8);
      graphics.endFill();
    });
  
    village.wards.forEach((ward) => {
      graphics.lineStyle(1, 0xc000f5);
      graphics.drawCircle(ward.centroid[0], ward.centroid[1], 1);
    });
  }
}
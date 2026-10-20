import { Bacteria } from '../models/Bacteria';
import { Nutrient } from '../models/Nutrient';
import { SimConfig } from '../config/SimulationConfig';

export class ProceduralRenderer {
  public static renderNutrient(ctx: CanvasRenderingContext2D, n: Nutrient): void {
    ctx.fillStyle = n.isOrganicCorpse
      ? 'rgba(251, 191, 36, 0.78)'
      : 'rgba(74, 222, 128, 0.72)';
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  public static renderBacteria(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    lowDetail: boolean = false,
    isSelected: boolean = false
  ): void {
    ctx.save();
    ctx.translate(b.x, b.y);

    // Anillo de selección si el usuario está inspeccionando esta bacteria
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Aura de emisión química (Bacteriocinas / Quorum Sensing activo)
    if (b.isEmittingToxin && !lowDetail) {
      const pulse = 0.82 + Math.sin(b.animPhase * 1.6) * 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, SimConfig.TOXIN_RADIUS * pulse * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${b.dna.hue}, 90%, 65%, 0.22)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.rotate(b.angle);

    const r = b.radius;
    const hue = b.dna.hue;
    const traits = b.dna.traits;

    // Si está en estado de Endospora latente, se ve como un quiste mineralizado oscuro
    if (b.isSpore) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 25%, 30%)`;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 1. Halo exterior de Cápsula Mucosa
    if (traits.wall === 'capsule' && !lowDetail) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.65, r * 1.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.22)`;
      ctx.fill();
    }

    // 2. Apéndices Locomotores (solo en nivel de detalle normal)
    if (!lowDetail) {
      if (traits.motility === 'flagellated') {
        this.drawFlagellum(ctx, r, hue, b.animPhase);
      } else if (traits.motility === 'ciliated') {
        this.drawCilia(ctx, r, hue, b.animPhase);
      } else if (traits.motility === 'sessile') {
        this.drawBiofilmPili(ctx, r, hue);
      }
    }

    // 3. Soma celular según Metabolismo
    ctx.beginPath();
    if (traits.metabolism === 'photosynthetic') {
      // Coco esférico
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else if (traits.metabolism === 'predator') {
      // Vibrio / Espirilo afilado
      ctx.ellipse(0, 0, r * 1.5, r * 0.7, 0, 0, Math.PI * 2);
    } else if (traits.metabolism === 'fermenter') {
      // Diplococo / Célula lobulada de fermentación
      ctx.arc(-r * 0.42, 0, r * 0.78, 0, Math.PI * 2);
      ctx.arc(r * 0.42, 0, r * 0.78, 0, Math.PI * 2);
    } else {
      // Bacilo clásico (Saprófita)
      ctx.ellipse(0, 0, r * 1.3, r * 0.85, 0, 0, Math.PI * 2);
    }

    ctx.fillStyle = `hsl(${hue}, 75%, 46%)`;
    ctx.fill();

    // 4. Pared Celular (Gram+ gruesa vs Gram- doble membrana)
    ctx.lineWidth = traits.wall === 'gram_positive' ? 3.0 : 1.3;
    ctx.strokeStyle = `hsl(${hue}, 90%, 24%)`;
    ctx.stroke();

    if (traits.wall === 'gram_negative' && !lowDetail) {
      ctx.strokeStyle = `hsla(${hue}, 90%, 72%, 0.55)`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // 5. Detalle intracelular ligero (vacuolas o vesículas químicas) en alto detalle
    if (!lowDetail) {
      ctx.beginPath();
      ctx.arc(r * 0.25, -r * 0.15, Math.max(1.2, r * 0.22), 0, Math.PI * 2);
      ctx.fillStyle =
        traits.interaction !== 'neutral'
          ? `hsla(${(hue + 45) % 360}, 95%, 78%, 0.65)`
          : `hsla(${hue}, 85%, 82%, 0.4)`;
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawFlagellum(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, 0);
    for (let i = 1; i <= 4; i++) {
      const segX = -r * 1.2 - i * 5.5;
      const segY = Math.sin(phase + i * 1.3) * (3 + i * 0.9);
      ctx.lineTo(segX, segY);
    }
    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.65)`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  private static drawCilia(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    ctx.strokeStyle = `hsla(${hue}, 70%, 65%, 0.55)`;
    ctx.lineWidth = 1.1;
    const count = 12;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const sx = Math.cos(a) * (r * 1.2);
      const sy = Math.sin(a) * (r * 0.85);
      const wave = Math.sin(phase + i) * 0.3;
      const ex = Math.cos(a + wave) * (r * 1.2 + 3.5);
      const ey = Math.sin(a + wave) * (r * 0.85 + 3.5);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();
  }

  private static drawBiofilmPili(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number
  ): void {
    ctx.fillStyle = `hsla(${hue}, 65%, 55%, 0.14)`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

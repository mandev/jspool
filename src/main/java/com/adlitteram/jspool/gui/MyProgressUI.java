package com.adlitteram.jspool.gui;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Insets;
import javax.swing.*;
import javax.swing.plaf.basic.BasicProgressBarUI;

public class MyProgressUI extends BasicProgressBarUI {

  @Override
  protected void paintDeterminate(Graphics g, JComponent c) {
    if (!(g instanceof Graphics2D)) {
      return;
    }

    Insets b = progressBar.getInsets(); // area for border
    int barRectWidth = progressBar.getWidth() - (b.right + b.left);
    int barRectHeight = progressBar.getHeight() - (b.top + b.bottom);

    if (barRectWidth <= 0 || barRectHeight <= 0) {
      return;
    }

    int cellLength = getCellLength();
    int cellSpacing = getCellSpacing();
    // amount of progress to draw
    int amountFull = getAmountFull(b, barRectWidth, barRectHeight);

    Graphics2D g2 = (Graphics2D) g;
    g2.setColor(Color.GREEN);

    if (progressBar.getOrientation() == SwingConstants.HORIZONTAL) {
      // draw the cells
      if (cellSpacing == 0 && amountFull > 0) {
        // draw one big Rect because there is no space between cells
        g2.setStroke(new BasicStroke(barRectHeight, BasicStroke.CAP_BUTT, BasicStroke.JOIN_BEVEL));
      } else {
        // draw each individual cell
        g2.setStroke(
            new BasicStroke(
                barRectHeight,
                BasicStroke.CAP_BUTT,
                BasicStroke.JOIN_BEVEL,
                0.f,
                new float[] {cellLength, cellSpacing},
                0.f));
      }

      if (c.getComponentOrientation().isLeftToRight()) {
        g2.drawLine(
            b.left, (barRectHeight / 2) + b.top, amountFull + b.left, (barRectHeight / 2) + b.top);
      } else {
        g2.drawLine(
            (barRectWidth + b.left),
            (barRectHeight / 2) + b.top,
            barRectWidth + b.left - amountFull,
            (barRectHeight / 2) + b.top);
      }

    } else { // VERTICAL
      // draw the cells
      if (cellSpacing == 0 && amountFull > 0) {
        // draw one big Rect because there is no space between cells
        g2.setStroke(new BasicStroke(barRectWidth, BasicStroke.CAP_BUTT, BasicStroke.JOIN_BEVEL));
      } else {
        // draw each individual cell
        g2.setStroke(
            new BasicStroke(
                barRectWidth,
                BasicStroke.CAP_BUTT,
                BasicStroke.JOIN_BEVEL,
                0f,
                new float[] {cellLength, cellSpacing},
                0f));
      }

      g2.drawLine(
          barRectWidth / 2 + b.left,
          b.top + barRectHeight,
          barRectWidth / 2 + b.left,
          b.top + barRectHeight - amountFull);
    }

    // Deal with possible text painting
    if (progressBar.isStringPainted()) {
      g2.setColor(Color.BLACK);
      paintString(g, b.left, b.top, barRectWidth, barRectHeight, amountFull, b);
    }
  }
}

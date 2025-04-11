import { Template, BLANK_PDF } from '@pdfme/common';

export const pdfTemplate: Template = {
  basePdf: BLANK_PDF,
  schemas: [[
    {
      name: 'header',
      type: 'text',
      position: { x: 10, y: 10 },
      width: 190,
      height: 20,
      fontSize: 14,
    },
    {
      name: 'contact',
      type: 'text',
      position: { x: 10, y: 30 },
      width: 190,
      height: 30,
      fontSize: 10,
    },
    {
      name: 'body',
      type: 'text',
      position: { x: 10, y: 65 },
      width: 190,
      height: 180,
      fontSize: 11,
    },
    {
      name: 'signature',
      type: 'text',
      position: { x: 10, y: 250 },
      width: 190,
      height: 20,
      fontSize: 11,
    },
  ]],
};

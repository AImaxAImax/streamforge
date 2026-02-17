/**
 * vMix HTTP API Integration
 * Docs: https://www.vmix.com/help26/DeveloperAPI.html
 *
 * Handles pushing social comments to vMix via:
 * 1. Data Source XML (vMix reads from our local HTTP endpoint)
 * 2. SetText API (directly inject text into title inputs)
 */

import axios from 'axios';

export class VMixClient {
  constructor(host = 'localhost', port = 8088) {
    this.baseUrl = `http://${host}:${port}/api`;
    this.host = host;
    this.port = port;
  }

  // Get full vMix state XML
  async getState() {
    const res = await axios.get(this.baseUrl);
    return res.data;
  }

  // Send a function command to vMix
  async sendFunction(fn, params = {}) {
    const queryParams = new URLSearchParams({ Function: fn, ...params });
    const url = `${this.baseUrl}?${queryParams}`;
    const res = await axios.get(url);
    return res.data;
  }

  // Set text in a title input
  // input: input name or number
  // selectedName: the text field name inside the title
  // value: the text to set
  async setText(input, selectedName, value) {
    return this.sendFunction('SetText', {
      Input: input,
      SelectedName: selectedName,
      Value: value,
    });
  }

  // Set multiple fields in a title at once
  async setTitleFields(input, fields) {
    for (const [name, value] of Object.entries(fields)) {
      await this.setText(input, name, value);
    }
  }

  // Trigger a title animation/transition
  async titleBeginAnimation(input, animation = 'TransitionIn') {
    return this.sendFunction('TitleBeginAnimation', {
      Input: input,
      Value: animation,
    });
  }

  // Check if vMix is reachable
  async ping() {
    try {
      await this.getState();
      return true;
    } catch {
      return false;
    }
  }
}

// vMix Data Source XML format
// vMix reads this via HTTP - we serve it from our local Express server
export function buildDataSourceXML(comments) {
  const rows = comments.map((c, i) => `
    <row>
      <field name="Index">${i + 1}</field>
      <field name="Platform">${escapeXml(c.platform)}</field>
      <field name="Author">${escapeXml(c.author)}</field>
      <field name="Message">${escapeXml(c.message)}</field>
      <field name="Avatar">${escapeXml(c.avatar || '')}</field>
      <field name="Timestamp">${escapeXml(c.timestamp)}</field>
      <field name="IsHighlighted">${c.highlighted ? '1' : '0'}</field>
    </row>`).join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<DataSource>
  <DataFields>
    <Field name="Index" />
    <Field name="Platform" />
    <Field name="Author" />
    <Field name="Message" />
    <Field name="Avatar" />
    <Field name="Timestamp" />
    <Field name="IsHighlighted" />
  </DataFields>
  <Data>${rows}
  </Data>
</DataSource>`;
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

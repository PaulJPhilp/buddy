"use client";

import React from "react";

interface TableProps {
  children: React.ReactNode;
}

interface TableCellProps {
  children: React.ReactNode;
  isHeader?: boolean;
}

// Scrollable table wrapper for wide tables
function InteractiveScrollableTable({
  children,
  maxWidth = "100%",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      style={{
        maxWidth,
        overflowX: "auto",
        overflowY: "hidden",
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </div>
  );
}

export function CustomTable({ children }: TableProps) {
  return (
    <InteractiveScrollableTable maxWidth="100%">
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          minWidth: "200px",
          fontSize: "0.75rem",
          lineHeight: "1.2",
        }}
      >
        {children}
      </table>
    </InteractiveScrollableTable>
  );
}

export function CustomTableCell({
  children,
  isHeader = false,
}: TableCellProps) {
  const Tag = isHeader ? "th" : "td";

  return (
    <Tag
      style={{
        padding: "0.375rem 0.5rem",
        textAlign: "left",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: isHeader ? "#f9fafb" : "white",
        fontWeight: isHeader ? "600" : "400",
        fontSize: "0.75rem",
        lineHeight: "1.2",
      }}
    >
      {children}
    </Tag>
  );
}

// Helper function to parse markdown table and render with custom components
export function parseMarkdownTable(markdownTable: string) {
  const lines = markdownTable.trim().split("\n");
  const headerLine = lines[0];
  const dataLines = lines.slice(2);

  // Parse header
  const headers = headerLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell);

  // Parse data rows
  const rows = dataLines.map((line) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell),
  );

  return (
    <CustomTable>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <CustomTableCell key={`header-${index}`} isHeader={true}>
              {header}
            </CustomTableCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <CustomTableCell key={`cell-${rowIndex}-${cellIndex}`}>
                {cell}
              </CustomTableCell>
            ))}
          </tr>
        ))}
      </tbody>
    </CustomTable>
  );
}

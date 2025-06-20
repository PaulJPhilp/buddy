import React from "react";
import { InteractiveScrollableTable } from "./InteractiveScrollableTable";

interface TableProps {
  children: React.ReactNode;
}

interface TableCellProps {
  children: React.ReactNode;
  isHeader?: boolean;
}

export function CustomTable({ children }: TableProps) {
  return (
    <InteractiveScrollableTable maxWidth="300px">
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          minWidth: "700px", // Force minimum width to ensure scrolling
          fontSize: "9px",
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
  const cellStyle = {
    border: "1px solid #ccc",
    padding: "4px 8px",
    textAlign: "left" as const,
    fontSize: "9px",
    whiteSpace: "nowrap" as const,
    ...(isHeader && {
      backgroundColor: "#f5f5f5",
      fontWeight: "700",
    }),
  };

  return isHeader ? (
    <th style={cellStyle}>{children}</th>
  ) : (
    <td style={cellStyle}>{children}</td>
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
          {headers.map((header) => (
            <CustomTableCell key={header} isHeader={true}>
              {header}
            </CustomTableCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}-${row.join('-')}`}>
            {row.map((cell, cellIndex) => (
              <CustomTableCell key={`cell-${rowIndex}-${cellIndex}-${cell}`}>{cell}</CustomTableCell>
            ))}
          </tr>
        ))}
      </tbody>
    </CustomTable>
  );
}

/**
 * Table Component System
 *
 * Reusable table components for consistent table rendering across the application.
 *
 * @example
 * ```tsx
 * import {
 *   TableContainer,
 *   Table,
 *   TableHead,
 *   TableBody,
 *   TableRow,
 *   TableHeaderCell,
 *   TableCell,
 *   TableEmptyState,
 *   TableLoadingState,
 * } from '~/components/common/Table';
 *
 * <TableContainer>
 *   <Table>
 *     <TableHead>
 *       <tr>
 *         <TableHeaderCell sortable sortDirection={sortDir()} onSort={handleSort}>
 *           Name
 *         </TableHeaderCell>
 *         <TableHeaderCell align="center">Status</TableHeaderCell>
 *         <TableHeaderCell align="right">Actions</TableHeaderCell>
 *       </tr>
 *     </TableHead>
 *     <TableBody>
 *       <For each={items()}>
 *         {(item) => (
 *           <TableRow>
 *             <TableCell>{item.name}</TableCell>
 *             <TableCell align="center"><Badge>{item.status}</Badge></TableCell>
 *             <TableCell align="right"><Button>Edit</Button></TableCell>
 *           </TableRow>
 *         )}
 *       </For>
 *     </TableBody>
 *   </Table>
 * </TableContainer>
 * ```
 */

export { default as TableContainer } from './TableContainer';
export { default as Table } from './Table';
export { default as TableHead } from './TableHead';
export { default as TableBody } from './TableBody';
export { default as TableRow } from './TableRow';
export { default as TableHeaderCell } from './TableHeaderCell';
export { default as TableCell } from './TableCell';
export { default as TableEmptyState } from './TableEmptyState';
export { default as TableLoadingState } from './TableLoadingState';

// Types
export type { Alignment, SortDirection } from './types';

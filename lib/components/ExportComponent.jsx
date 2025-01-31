import React, { useState } from 'react';
import { ApiClient, useNotice } from 'adminjs';
import { Box, Button, Loader, Text, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';
import { saveAs } from 'file-saver';
import format from 'date-fns/format';

export const getExportedFileName = (extension, resourceName) => `export-${resourceName}-${format(Date.now(), 'yyyy-MM-dd_HH-mm')}.${extension}`;

const ExportComponent = ({ resource, records }) => {
    const [isFetching, setFetching] = useState();
    const sendNotice = useNotice();

    const exportData = async (type) => {
        setFetching(true);
        try {
            const { data: { exportedData }, } = await new ApiClient().resourceAction({
                method: 'post',
                resourceId: resource.id,
                actionName: 'export',
                params: {
                    type,
                },
                data: {
                    records: records.map(record => record.id),
                }
            });
            const blob = new Blob([exportedData], { type: 'application/json' });
            saveAs(blob, getExportedFileName(type, resource.id));
            sendNotice({ message: 'Exported successfully', type: 'success' });
        }
        catch (e) {
            sendNotice({ message: e.message, type: 'error' });
        }
        setFetching(false);
    };
    if (isFetching) {
        return <Loader />;
    }
    return (
        <Box>
            <Box display="flex" justifyContent="center">
                <Text variant="lg">Choose export format:</Text>
            </Box>
            <Box display="flex" justifyContent="center">
                    <Box m={2}>
                        <Button
                            onClick={() => exportData('json')}
                            disabled={isFetching}
                        >
                            {'json'.toUpperCase()}
                        </Button>
                    </Box>
            </Box>
            <Box>
                <Table>
                    <TableHead>
                        <TableRow>
                            {
                                records.map((record) => {
                                    const params = Object.keys(record.params);
                                    return params
                                        .map((param, index) => <TableCell key={`${index}`}>{param}</TableCell>)
                                        .slice(0, 8);
                                })[0]
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.map(({ params }, rowIndex) => {
                            return (
                                <TableRow key={`value-${params._id}-${rowIndex}`}>
                                    {Object.values(params)
                                        .slice(0, 8)
                                        .map((param, index) => (
                                            <TableCell key={`value-${param}-${index}`}>{param}</TableCell>
                                        ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
};
export default ExportComponent;

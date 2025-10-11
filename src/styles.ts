import { StylesheetJson } from 'cytoscape';

// Get shared Cytoscape styles (used for main canvas and previews)
export function getCytoscapeStyles(): StylesheetJson {
    return [
        // Start node styles
        {
            selector: 'node[type="start"]',
            style: {
                'background-color': '#81c784',
                'min-width': "80",
                'min-height': "50",
                'shape': 'diamond',
                'label': 'data(label)',
                'color': 'white',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': '#81c784',
                // 'box-shadow': '0 0 10px rgba(129, 199, 132, 0.3)',
                'padding': "0",  // Allow terminals at the edges
                'compound-sizing-wrt-labels': 'include'  // Include label in size calculation
            }
        },
        // Stop node styles
        {
            selector: 'node[type="stop"]',
            style: {
                'background-color': '#e57373',
                'min-width': "80",
                'min-height': "50",
                'shape': 'diamond',
                'label': 'data(label)',
                'color': 'white',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': '#e57373',
                // 'box-shadow': '0 0 10px rgba(229, 115, 115, 0.3)',
                'padding': '0',  // Allow terminals at the edges
                'compound-sizing-wrt-labels': 'include'  // Include label in size calculation
            }
        },
        // Compound parent node styles
        {
            selector: 'node[type="compound"]',
            style: {
                'background-color': '#2d2d30',
                'border-width': 2,
                'border-color': '#ba68c8',
                'label': 'data(label)',
                'color': '#d4d4d4',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '11',
                'padding': '5',
                'shape': 'round-rectangle',
                // 'box-shadow': '0 0 10px rgba(186, 104, 200, 0.3)'
            }
        },
        // Input terminal styles (children of compound)
        {
            selector: 'node[type="input-terminal"]',
            style: {
                'background-color': '#81c784',
                'width': 12,
                'height': 12,
                'border-width': 2,
                'border-color': '#81c784',
                'label': '',
                'events': 'yes'
            }
        },
        // Output terminal styles (children of compound)
        {
            selector: 'node[type="output-terminal"]',
            style: {
                'background-color': '#ffb74d',
                'width': 12,
                'height': 12,
                'border-width': 2,
                'border-color': '#ffb74d',
                'label': '',
                'events': 'yes'
            }
        },
        // Edge styles
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#4fc3f7',
                'target-arrow-color': '#4fc3f7',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'arrow-scale': 1.5
            }
        },
        // Temporary edge (during right-click drag)
        {
            selector: 'edge.temp',
            style: {
                'line-color': '#ffb74d',
                'target-arrow-color': '#ffb74d',
                'line-style': 'dashed',
                'opacity': 0.6
            }
        },
        // Selected elements
        {
            selector: ':selected',
            style: {
                'border-color': '#ffb74d',
                'border-width': 4
            }
        }
    ];
}
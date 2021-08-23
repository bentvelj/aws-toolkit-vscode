/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as assert from 'assert'
import { ForceDirectedGraph } from '../../../samVisualize/rendering/forceDirectedGraph'
import * as RenderConstants from '../../../samVisualize/rendering/renderConstants'
import { JSDOM } from 'jsdom'
import { GraphObject } from '../../../samVisualize/graphGeneration/graph'

const testGraphData: GraphObject = {
    nodes: [
        { name: 'ApiUsagePlan', type: 'AWS::ApiGateway::UsagePlan' },
        { name: 'ApiDeployment', type: 'AWS::ApiGateway::Deployment' },
        { name: 'ApiUsagePlanKey', type: 'AWS::ApiGateway::UsagePlanKey' },
        { name: 'ApiKey', type: 'AWS::ApiGateway::ApiKey' },
        { name: 'APIGatewayRole', type: 'AWS::IAM::Role' },
        { name: 'DynamoDBTable', type: 'AWS::DynamoDB::Table' },
        { name: 'MusicMethodPost', type: 'AWS::ApiGateway::Method' },
        { name: 'MusicArtistMethodGet', type: 'AWS::ApiGateway::Method' },
        { name: 'Api', type: 'AWS::ApiGateway::RestApi' },
        { name: 'MusicResource', type: 'AWS::ApiGateway::Resource' },
        { name: 'MusicArtistResource', type: 'AWS::ApiGateway::Resource' },
    ],
    links: [
        {
            source: 'ApiUsagePlan',
            target: 'ApiDeployment',
            type: 'DependsOn',
        },
        { source: 'ApiUsagePlan', target: 'Api', type: 'Intrinsic Function' },
        { source: 'ApiKey', target: 'ApiDeployment', type: 'DependsOn' },
        { source: 'ApiKey', target: 'Api', type: 'Intrinsic Function' },
        {
            source: 'ApiDeployment',
            target: 'MusicArtistMethodGet',
            type: 'DependsOn',
        },
        { source: 'ApiDeployment', target: 'Api', type: 'Intrinsic Function' },
        {
            source: 'MusicArtistMethodGet',
            target: 'APIGatewayRole',
            type: 'Intrinsic Function',
        },
        { source: 'MusicArtistMethodGet', target: 'Api', type: 'Intrinsic Function' },
        {
            source: 'MusicArtistMethodGet',
            target: 'MusicArtistResource',
            type: 'Intrinsic Function',
        },
        {
            source: 'APIGatewayRole',
            target: 'DynamoDBTable',
            type: 'Intrinsic Function',
        },
        { source: 'ApiUsagePlanKey', target: 'ApiUsagePlan', type: 'Intrinsic Function' },
        { source: 'ApiUsagePlanKey', target: 'ApiKey', type: 'Intrinsic Function' },
        { source: 'MusicResource', target: 'Api', type: 'Intrinsic Function' },
        { source: 'MusicResource', target: 'Api', type: 'Intrinsic Function' },
        { source: 'MusicArtistResource', target: 'Api', type: 'Intrinsic Function' },
        {
            source: 'MusicArtistResource',
            target: 'MusicResource',
            type: 'Intrinsic Function',
        },
        { source: 'MusicMethodPost', target: 'Api', type: 'Intrinsic Function' },
        { source: 'MusicMethodPost', target: 'MusicResource', type: 'Intrinsic Function' },
        {
            source: 'MusicMethodPost',
            target: 'APIGatewayRole',
            type: 'Intrinsic Function',
        },
    ],
}

describe('samVisualize d3.js rendering of a GraphObject', async function () {
    let doc: Document
    let forceDirectedGraph: ForceDirectedGraph

    beforeEach(function () {
        doc = new JSDOM(`<html><body></body></html>`, { runScripts: 'dangerously', resources: 'usable' }).window
            .document
        forceDirectedGraph = new ForceDirectedGraph(testGraphData, [], {}, doc)
    })

    it('constructs an svg element with specified width and height', function () {
        forceDirectedGraph.constructSVG(500, 500, 'svg', doc)
        assert.ok(doc.getElementById('svg'))
        assert.strictEqual(doc.getElementById('svg')!.getAttribute('width'), '500')
        assert.strictEqual(doc.getElementById('svg')!.getAttribute('height'), '500')
    })

    it('defines a marker to represent an arrowhead', function () {
        const svg = forceDirectedGraph.constructSVG(500, 500, 'svg', doc)
        forceDirectedGraph.defineArrowHead(svg, 'test-arrowhead')

        assert.ok(doc.getElementById('test-arrowhead'))

        assert.strictEqual(
            doc.getElementById('test-arrowhead')?.getElementsByTagName('path')[0]!.style.opacity,
            RenderConstants.LinkOpacity.toString()
        )
        // CorrectViewbox
        assert.strictEqual(
            doc.getElementById('test-arrowhead')!.getAttribute('viewBox'),
            RenderConstants.arrowheadViewbox
        )
        // Square viewbox
        assert.strictEqual(
            doc.getElementById('test-arrowhead')!.getAttribute('markerWidth'),
            RenderConstants.arrowheadSize.toString()
        )
        assert.strictEqual(
            doc.getElementById('test-arrowhead')!.getAttribute('markerHeight'),
            RenderConstants.arrowheadSize.toString()
        )

        // Alignment
        assert.strictEqual(doc.getElementById('test-arrowhead')!.getAttribute('refX'), '0')
        assert.strictEqual(doc.getElementById('test-arrowhead')!.getAttribute('refY'), '0')
    })

    it('appends container g element to svg', function () {
        const svg = forceDirectedGraph.constructSVG(500, 500, 'svg', doc)
        forceDirectedGraph.appendGContainerElement(svg, 'test-container')

        assert.ok(doc.getElementById('test-container'))
    })

    it('creates a path element for each link in the graph', function () {
        const svg = forceDirectedGraph.constructSVG(500, 500, 'svg', doc)
        const gContainer = forceDirectedGraph.appendGContainerElement(svg)

        forceDirectedGraph.constructLinks(gContainer, testGraphData.links, 'test-linkContainer')

        assert.ok(doc.getElementById('test-linkContainer'))
        const linkList = doc.getElementById('test-linkContainer')?.querySelectorAll('.link')
        assert.strictEqual(linkList?.length, testGraphData.links.length)
        linkList.forEach(link => {
            // 2 paths per link
            assert.deepStrictEqual(link.getElementsByTagName('path').length, 2)
            // First path is rendered path
            assert.deepStrictEqual(
                link.getElementsByTagName('path')[0].style.strokeOpacity,
                RenderConstants.LinkOpacity.toString()
            )

            // Second path is invisible tooltip path
            assert.ok(link.getElementsByTagName('path')[1].getElementsByTagName('title'))
            assert.deepStrictEqual(link.getElementsByTagName('path')[1].style.strokeOpacity, '0')
        })
    })
    it('calculates correct vectors for links to surface of node', function () {
        const dx = 100
        const dy = 100
        const radius = 25
        const testVector = forceDirectedGraph.scaleLinkVector(dx, dy, radius)
        assert.ok(testVector)

        assert.deepStrictEqual(Math.abs(testVector.xComponent - 75.25) < 0.01, true, testVector.xComponent.toString())
        assert.deepStrictEqual(Math.abs(testVector.yComponent - 75.25) < 0.01, true, testVector.yComponent.toString())

        assert.ifError(forceDirectedGraph.scaleLinkVector(0, 0, 0))
    })
    it('creates a g element for each node in the graph', function () {
        const svg = forceDirectedGraph.constructSVG(500, 500, 'svg', doc)
        const gContainer = forceDirectedGraph.appendGContainerElement(svg)

        forceDirectedGraph.constructNodes(gContainer, testGraphData.nodes, {}, undefined, 'test-nodeContainer')

        const nodeList = doc.getElementById('test-nodeContainer')?.querySelectorAll('.node')
        assert.strictEqual(nodeList?.length, testGraphData.nodes.length)
    })

    it('creates correctly labeled circular images for each node ', function () {
        const svg = forceDirectedGraph.constructSVG(500, 500, 'svg', doc)
        const gContainer = forceDirectedGraph.appendGContainerElement(svg)

        forceDirectedGraph.constructNodes(gContainer, testGraphData.nodes, {}, undefined, 'test-nodeContainer')

        const nodeList = doc.getElementById('test-nodeContainer')?.querySelectorAll('.node')
        assert.ok(nodeList)

        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList.item(i)
            assert.strictEqual(node.querySelector('clipPath > circle')?.getAttribute('r'), '25')

            const nodeName = node.querySelector('title')?.textContent

            // Node title exists
            assert.ok(nodeName)

            // Primary and secondary labels exist
            const primaryLabel = node.querySelectorAll('text').item(0)
            assert.ok(primaryLabel)

            const secondaryLabel = node.querySelectorAll('text').item(1)
            assert.ok(secondaryLabel)

            // Correct text positioning, primary label matches node name
            assert.strictEqual(primaryLabel.getAttribute('dy'), RenderConstants.primaryLabelYOffset.toString())
            assert.strictEqual(primaryLabel.textContent, nodeName)

            assert.strictEqual(secondaryLabel.getAttribute('dy'), RenderConstants.secondaryLabelYOffset.toString())

            // Secondary label exists and holds a type in the form AWS::<service>::<type>
            const nodeType = secondaryLabel.textContent
            assert.ok(nodeType)
            assert.ok(nodeType.match('AWS::[^:]+::[^:]+'))

            // Assert image exists
            assert.ok(node.querySelector('image'))
        }
    })

    it('creates two radio buttons to toggle filters', function () {
        forceDirectedGraph.drawFilterRadioButtons('test-primaryButton', 'test-allButton', doc, 'test-buttonGroup')

        assert.ok(doc.getElementById('test-buttonGroup'))
        // Primary button exists and is within div
        assert.ok(doc.getElementById('test-buttonGroup')?.contains(doc.getElementById('test-primaryButton')))
        assert.strictEqual(doc.getElementById('test-primaryButton')!.getAttribute('type'), 'radio')

        // Default primary is checked
        assert.ok(doc.getElementById('test-primaryButton')!.getAttribute('checked'))

        // All button exists and is within div
        assert.ok(doc.getElementById('test-buttonGroup')?.contains(doc.getElementById('test-allButton')))
        assert.strictEqual(doc.getElementById('test-allButton')!.getAttribute('type'), 'radio')

        // All button is unchecked
        assert.ifError(doc.getElementById('test-allButton')!.getAttribute('checked'))

        // Buttons have same name, forming a radio button group
        assert.strictEqual(
            doc.getElementById('test-primaryButton')!.getAttribute('name'),
            doc.getElementById('test-allButton')!.getAttribute('name')
        )
    })

    it('successfully defines a simulation', function () {
        const s = forceDirectedGraph.simulation
        assert.ok(s)
        assert.ok(s.force('charge'))
        assert.ok(s.force('center'))
        assert.ok(s.force('forceX'))
        assert.ok(s.force('forceY'))
        assert.deepStrictEqual(s.alphaTarget(), RenderConstants.reheatAlphaTarget)
        assert.deepStrictEqual(s.alphaDecay(), RenderConstants.alphaDecay)
        assert.deepStrictEqual(s.alphaMin(), -1)
    })

    it('adjusts alphaTarget on tick', function () {
        const s = forceDirectedGraph.simulation

        assert.deepStrictEqual(s.alphaTarget(), RenderConstants.reheatAlphaTarget)
        forceDirectedGraph.ticked()
        assert.deepStrictEqual(s.alphaTarget(), RenderConstants.reheatAlphaTarget)
        s.alpha(RenderConstants.reheatAlphaTarget)
        forceDirectedGraph.ticked()
        // After hitting reheat goal, target is set to long term value
        assert.deepStrictEqual(s.alphaTarget(), RenderConstants.alphaTarget)
    })
})
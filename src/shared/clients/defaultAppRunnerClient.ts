/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Service } from 'aws-sdk'
import { ext } from '../../shared/extensionGlobals'

// TODO: These two files can be removed when App Runner is officially released:
import * as AppRunner from '../../apprunner/models/apprunner'
import apiConfig = require('../../apprunner/models/service-2.json')
import { AppRunnerClient } from './apprunnerClient'

export class DefaultAppRunnerClient implements AppRunnerClient {
    public constructor(public readonly regionCode: string) {}

    public async createService(request: AppRunner.CreateServiceRequest): Promise<AppRunner.CreateServiceResponse> {
        return (await this.createSdkClient()).createService(request).promise()
    }

    public async listServices(request: AppRunner.ListServicesRequest): Promise<AppRunner.ListServicesResponse> {
        return (await this.createSdkClient()).listServices(request).promise()
    }

    public async pauseService(request: AppRunner.PauseServiceRequest): Promise<AppRunner.PauseServiceResponse> {
        return (await this.createSdkClient()).pauseService(request).promise()
    }

    public async resumeService(request: AppRunner.ResumeServiceRequest): Promise<AppRunner.ResumeServiceResponse> {
        return (await this.createSdkClient()).resumeService(request).promise()
    }

    public async updateService(request: AppRunner.UpdateServiceRequest): Promise<AppRunner.UpdateServiceResponse> {
        return (await this.createSdkClient()).updateService(request).promise()
    }

    public async listConnections(
        request: AppRunner.ListConnectionsRequest
    ): Promise<AppRunner.ListConnectionsResponse> {
        return (await this.createSdkClient()).listConnections(request).promise()
    }

    public async describeService(
        request: AppRunner.DescribeServiceRequest
    ): Promise<AppRunner.DescribeServiceResponse> {
        return (await this.createSdkClient()).describeService(request).promise()
    }

    public async startDeployment(
        request: AppRunner.StartDeploymentRequest
    ): Promise<AppRunner.StartDeploymentResponse> {
        return (await this.createSdkClient()).startDeployment(request).promise()
    }

    public async listOperations(request: AppRunner.ListOperationsRequest): Promise<AppRunner.ListOperationsResponse> {
        return (await this.createSdkClient()).listOperations(request).promise()
    }

    public async deleteService(request: AppRunner.DeleteServiceRequest): Promise<AppRunner.DeleteServiceResponse> {
        return (await this.createSdkClient()).deleteService(request).promise()
    }

    protected async createSdkClient(): Promise<AppRunner> {
        return await ext.sdkClientBuilder.createAndConfigureServiceClient(
            opts => new Service(opts),
            {
                // @ts-ignore: apiConfig is internal and not in the TS declaration file
                apiConfig: apiConfig,
                region: this.regionCode,
                endpoint: 'https://fusion.gamma.us-east-1.bullet.aws.dev',
            },
            undefined,
            false
        )
    }
}
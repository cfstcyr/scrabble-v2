import { VirtualPlayerProfile, VirtualPlayerProfileData } from '@app/classes/database/virtual-player-profile';
import { HttpException } from '@app/classes/http-exception/http-exception';
import { VirtualPlayerLevel } from '@app/classes/player/virtual-player-level';
import {
    DEFAULT_VIRTUAL_PLAYER_PROFILES_RELATIVE_PATH,
    VIRTUAL_PLAYER_PROFILES_MONGO_COLLECTION_NAME,
} from '@app/constants/services-constants/mongo-db.const';
import { CANNOT_ADD_DEFAULT_PROFILE, NAME_ALREADY_USED } from '@app/constants/services-errors';
import DatabaseService from '@app/services/database-service/database.service';
import { promises } from 'fs';
import { StatusCodes } from 'http-status-codes';
import 'mock-fs'; // required when running test. Otherwise compiler cannot resolve fs, path and __dirname
import { Collection, ObjectId } from 'mongodb';
import { join } from 'path';
import { Service } from 'typedi';

@Service()
export default class VirtualPlayerProfilesService {
    constructor(private databaseService: DatabaseService) {}

    private static async fetchDefaultVirtualPlayerProfiles(): Promise<VirtualPlayerProfile[]> {
        const filePath = join(__dirname, DEFAULT_VIRTUAL_PLAYER_PROFILES_RELATIVE_PATH);
        const dataBuffer = await promises.readFile(filePath, 'utf-8');
        const defaultVirtualPlayerProfiles: VirtualPlayerProfileData = JSON.parse(dataBuffer);
        return defaultVirtualPlayerProfiles.virtualPlayerProfiles;
    }

    async getAllVirtualPlayerProfiles(): Promise<VirtualPlayerProfile[]> {
        return this.collection.find({}).toArray();
    }

    async getVirtualPlayerProfilesFromLevel(level: VirtualPlayerLevel): Promise<VirtualPlayerProfile[]> {
        return this.collection.find({ level }).toArray();
    }

    async addVirtualPlayerProfile(newProfile: VirtualPlayerProfile): Promise<void> {
        if (await this.isNameAlreadyUsed(newProfile.name)) throw new HttpException(NAME_ALREADY_USED(newProfile.name), StatusCodes.BAD_REQUEST);
        if (newProfile.isDefault) throw new HttpException(CANNOT_ADD_DEFAULT_PROFILE, StatusCodes.BAD_REQUEST);

        await this.collection.insertOne(newProfile);
    }

    async updateVirtualPlayerProfile(newName: string, profileId: string): Promise<void> {
        if (await this.isNameAlreadyUsed(newName)) throw new HttpException(NAME_ALREADY_USED(newName), StatusCodes.BAD_REQUEST);

        await this.collection.updateOne({ _id: new ObjectId(profileId), isDefault: false }, { $set: { name: newName } });
    }

    async deleteVirtualPlayerProfile(profileId: string): Promise<void> {
        await this.collection.deleteOne({ _id: new ObjectId(profileId), isDefault: false });
    }

    async resetVirtualPlayerProfiles(): Promise<void> {
        await this.collection.deleteMany({ isDefault: false });
        await this.populateDb();
    }

    private get collection(): Collection<VirtualPlayerProfile> {
        return this.databaseService.database.collection(VIRTUAL_PLAYER_PROFILES_MONGO_COLLECTION_NAME);
    }

    private async populateDb(): Promise<void> {
        await this.databaseService.populateDb(
            VIRTUAL_PLAYER_PROFILES_MONGO_COLLECTION_NAME,
            await VirtualPlayerProfilesService.fetchDefaultVirtualPlayerProfiles(),
        );
    }

    private async isNameAlreadyUsed(newName: string): Promise<boolean> {
        return (await this.collection.countDocuments({ name: newName })) > 0;
    }
}

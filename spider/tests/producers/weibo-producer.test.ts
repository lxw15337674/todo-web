import { describe, it, beforeEach, afterAll, expect } from 'vitest'
import { cleanDatabase, createTestProducer, prisma } from '../utils/test-utils'
import { WeiboProducer } from '../../src/producers/weiboProducer'

const testUserId = '6729689855'
describe('WeiboProducer', () => {
    beforeEach(async () => {
        await cleanDatabase()
    })

    afterAll(async () => {
        await cleanDatabase()
        await prisma.$disconnect()
    })
    const weiboProducer = new WeiboProducer();
    it('should fetch and process weibo posts', async () => {
        const posts = await weiboProducer.produceWeiboPosts(testUserId, 2);
        console.log(posts.length)
        expect(posts).toBeDefined()
    })
})

import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { beforeEach, test, expect, describe } from 'vitest';
import {
    Report,
    CreateReport,
    createReport,
    deleteReport,
    fetchAllReports,
    fetchReportById,
    updateReportStatus,
    fetchReportsByPostId,
    fetchReportsByUserId
} from '../services/apiReport';
import { Post, getAllPosts} from '../services/apiPost'

let testReportId: number;
let testPostId = 171; // 假设的测试帖子ID
let testUserId: string;
const testReason = "report reason";

const newReport:CreateReport={
    post_id: testPostId,
    reason: testReason
}


async function login() {
    const userStore = useUserStore();
    await userStore.initUser();
    await userStore.loginUser("admin2@gmail.com", "123456");
    if (!userStore.user) throw new Error('User not logged in');
    testUserId = userStore.user.id;
} 

describe.sequential('apiReport', async () => {
beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    await login();
});

test('create report', async () => {
    const post:Post = (await getAllPosts())[0];
    testPostId = post.id;
    newReport.post_id = testPostId;
    expect(async () => {
        await createReport(newReport);
    }).not.toThrow();
});

test('fetch all reports', async () => {
    const reports:Report[] = await fetchAllReports();
    expect(reports.length).toBeGreaterThan(0);
    testReportId = reports[0].id;
});

test('fetch report by id', async () => {
    const report:Report|null = await fetchReportById(testReportId);
    expect(report).not.toBeNull();
    if (!report) throw new Error('Report not found');
    expect(report.id).toBe(testReportId);
    expect(report.reason).toBe(testReason);
});

test('fetch reports by post id', async () => {
    const reports:Report[] = await fetchReportsByPostId(testPostId);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.some(r => r.id === testReportId)).toBe(true);
});

test('fetch reports by user id', async () => {
    const reports:Report[] = await fetchReportsByUserId(testUserId);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.some(r => r.id === testReportId)).toBe(true);
});

test('update report', async () => {
    console.log('testReportId:', testReportId);
    expect(async()=>{await updateReportStatus(testReportId, 'RESOLVED')}).not.toThrow();
});

test('get report again',async () => {
    const updatedReport:Report|null = await fetchReportById(testReportId);
    expect(updatedReport).not.toBeNull();
    expect(updatedReport?.status).toBe('RESOLVED');
})


test('delete report', async () => {
    expect(async()=>{await deleteReport(testReportId);}).not.toThrow();
    
});

test('get reports again', async () => {
    const report:Report|null = await fetchReportById(testReportId);
    expect(report).toBeNull();
})

});
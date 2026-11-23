"""Zero-dependency STATIC tests; cannot replace running real Blender."""
import ast
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"tools"/"blender_finalize_hanoi.py"
PS=ROOT/"tools"/"run_blender_windows.ps1"

class BlenderPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content=SCRIPT.read_text(encoding="utf-8")
        cls.ast=ast.parse(cls.content)
        cls.ps=PS.read_text(encoding="utf-8")

    def test_python_parses(self):
        self.assertTrue(self.ast.body)

    def test_main_entrypoint(self):
        self.assertIn('if __name__=="__main__":',self.content)
        self.assertIn("main()",self.content)

    def test_preserves_source_and_saves_separate_copy(self):
        self.assertIn("OUTNAME",self.content)
        self.assertIn("HANOI_WORLD_V04_OUTPUT",self.content)
        self.assertIn("bpy.ops.wm.save_as_mainfile",self.content)
        self.assertIn("not a previous output copy",self.content)

    def test_has_named_glb_group_exports(self):
        for name in ["hanoi_original_streets","nhau_pho_viet","vehicles_original",
                     "npc_original","hanoi_expansion_v04"]:
            self.assertIn(name,self.content)

    def test_grouped_blender_collections_preserved(self):
        for name in ["01_HANOI_TERRAIN","05_NHAU_PHO_VIET_EXTERIOR",
                     "06_NHAU_PHO_VIET_INTERIOR","08_VEHICLES","09_NPC_CHARACTERS",
                     "13_GAME_MARKERS"]:
            self.assertIn(name,self.content)

    def test_expansion_has_common_hanoi_assets(self):
        for name in ["TUBEHOUSE","SIDEWALK","LANE_DASH","CROSSWALK",
                     "TREE","LAMP","SCOOTER","STREET_TABLE","CONNECTOR_ROAD"]:
            self.assertIn(name,self.content)

    def test_reports_real_export_failures(self):
        self.assertIn('"ok":False',self.content)
        self.assertIn('HANOI_WORLD_BUILD_REPORT.json',self.content)
        self.assertIn('missing_textures',self.content)

    def test_does_not_force_merge_or_git_push(self):
        self.assertNotIn("git push --force",self.content)
        self.assertNotIn("git merge",self.content)

    def test_windows_runner_checks_blender_exe_and_source(self):
        self.assertIn("BlenderExe",self.ps)
        self.assertIn("Test-Path $SourceBlend",self.ps)
        self.assertIn("--python-exit-code 1",self.ps)

if __name__=="__main__":
    unittest.main()

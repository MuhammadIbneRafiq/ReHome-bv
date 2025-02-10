import { Card } from "./ui/card";
import { Edit } from "lucide-react";
import { Separator } from "./ui/separator";
import { useNavigate } from "react-router-dom";

export default function ChatInterface() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex justify-center p-4 flex-col md:flex-row gap-1 md:pt-4">
      <Card className="rounded-2 w-full md:max-w-[250px] h-[40vh] md:h-full md:max-h-full flex justify-between overflow-hidden">
        <div className="w-full flex flex-row md:flex-col p-6 justify-between md:items-start overflow-auto">
          <div className="flex flex-col w-full md:w-auto max-h-[40vh]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Chats</h2>
              <Edit
                onClick={() => navigate("/chatHome")}
                className="cursor-pointer"
              />
            </div>
            <Separator />
          </div>
          <div className="flex flex-col w-full md:w-auto h-[30vw]">
            <h2 className="font-semibold text-lg">Projects</h2>
            <Separator />
          </div>
          <div></div>
        </div>
      </Card>
    </div>
  );
}
